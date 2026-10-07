"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppIcon } from "@/common/components";
import { PRACTICE_ROUTES, UI_TEXT } from "./constants";
import { canStartPractice } from "./contracts";
import { isClientRuntimeSupported } from "./renderer-allowlist";
import type { PracticeApiError } from "./api";
import { createPracticeApiClient, createPracticeIdempotencyKey, PracticeApiError as PracticeApiErrorClass } from "./api";
import { fixtureForTask } from "./fixtures";
import { practiceSessionReducer, INITIAL_PRACTICE_SESSION_STATE } from "./session-state";
import { TaskRenderer } from "./renderers/TaskRenderer";
import type { PracticeSession, ResponseConfidence } from "./contracts";
import { usePractice } from "./PracticeProvider";

const CLIENT_CAPABILITIES = [
  "OPTION_SELECTION",
  "DRAG_AND_DROP",
  "DROPDOWN_SELECTION",
  "TEXT_INPUT",
];

export function PracticeSessionView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authStatus, entitlementStatus, catalogStatus, entitlement, catalog, isPracticeUnlocked } = usePractice();
  const api = useMemo(() => createPracticeApiClient(), []);
  const [state, dispatch] = useReducer(practiceSessionReducer, INITIAL_PRACTICE_SESSION_STATE);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ResponseConfidence | null>(null);
  const [hasRetryAction, setHasRetryAction] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const initialized = useRef<string | null>(null);
  const startKey = useRef<string | null>(null);
  const mutationKeys = useRef(new Map<string, string>());
  const retryMutation = useRef<(() => Promise<void>) | null>(null);
  const sessionRef = useRef<PracticeSession | null>(null);
  const heartbeatInFlight = useRef(false);
  const heartbeatPromise = useRef<Promise<PracticeSession | null> | null>(null);
  const heartbeatSyncRequired = useRef(false);
  const mutationInFlight = useRef(false);
  const taskCode = searchParams.get("task");
  const sessionId = searchParams.get("sessionId");
  const requestKey = sessionId ? `resume:${sessionId}` : `task:${taskCode ?? "missing"}`;

  useEffect(() => {
    sessionRef.current = state.session;
  }, [state.session]);

  const loadSession = useCallback(async () => {
    if (sessionId) {
      return api.getSession(sessionId);
    }
    if (!taskCode || !isPracticeUnlocked || !entitlement?.organizationContext) {
      throw new PracticeApiErrorClass(UI_TEXT.accessLocked, 403, "PRACTICE_NOT_ENTITLED");
    }
    const task = catalog.sections.flatMap((section) => section.taskTypes).find((item) => item.code === taskCode);
    if (!task || !canStartPractice("UNLOCKED", task)) {
      throw new PracticeApiErrorClass(UI_TEXT.sessionUnsupported, 422, "PRACTICE_CONTENT_NOT_READY");
    }
    startKey.current ??= createPracticeIdempotencyKey("start");
    return api.startSession({
      productCode: catalog.productCode,
      organizationId: entitlement.organizationContext.publicId,
      taskTypeCodes: [task.code],
      capabilities: { supportedCapabilities: CLIENT_CAPABILITIES, appVersion: "practice-web-1" },
    }, startKey.current);
  }, [api, catalog, entitlement, isPracticeUnlocked, sessionId, taskCode]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!sessionId && (entitlementStatus !== "ready" || catalogStatus !== "ready")) return;
    if (!sessionId && !taskCode) return;
    if (initialized.current === requestKey) return;
    initialized.current = requestKey;
    dispatch({ type: "loading" });
    void loadSession()
      .then((session) => {
        if (!sessionId) router.replace(`${PRACTICE_ROUTES.practiceSession}?sessionId=${session.publicId}`);
        dispatch({ type: "received", session });
      })
      .catch((reason: unknown) => dispatch({ type: "failed", message: sessionErrorMessage(reason) }));
  }, [authStatus, catalogStatus, entitlementStatus, loadSession, requestKey, retryCount, router, sessionId, taskCode]);

  useEffect(() => {
    if (state.phase !== "in_progress" && state.phase !== "submitting") return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "in_progress") return;
    const timer = window.setInterval(() => {
      if (heartbeatInFlight.current || mutationInFlight.current) return;
      const session = sessionRef.current;
      if (!session) return;
      heartbeatInFlight.current = true;
      const request = api.heartbeat(session.publicId, session.version, createPracticeIdempotencyKey("heartbeat"))
        .then((next) => {
          sessionRef.current = next;
          dispatch({ type: "mutation_succeeded", session: next });
          return next;
        })
        .catch((reason: unknown) => {
          heartbeatSyncRequired.current = true;
          dispatch({ type: "failed", message: sessionErrorMessage(reason) });
          return null;
        });
      heartbeatPromise.current = request.finally(() => {
        heartbeatInFlight.current = false;
        heartbeatPromise.current = null;
      });
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [api, state.phase]);

  async function begin() {
    if (!state.session) return;
    await runMutation("begin", (key) => {
      const session = sessionRef.current;
      return session
        ? api.beginSession(session.publicId, session.version, key)
        : Promise.reject(new PracticeApiErrorClass(UI_TEXT.sessionError, 0, "SESSION_UNAVAILABLE"));
    });
  }

  async function submit() {
    const session = state.session;
    const currentTask = session?.currentTask;
    if (!session || !currentTask) return;
    const answerDraft = effectiveDraft(currentTask, draftTaskId, draft);
    const answerConfidence = effectiveConfidence(currentTask, draftTaskId, confidence);
    if (!hasAnswer(answerDraft)) {
      dispatch({ type: "failed", message: UI_TEXT.sessionNoAnswer });
      return;
    }
    if (!answerConfidence) {
      dispatch({ type: "failed", message: UI_TEXT.sessionConfidence });
      return;
    }
    await runMutation(`answer:${currentTask.publicId}`, (key) => {
      const latest = sessionRef.current;
      return latest
        ? api.answer(latest.publicId, currentTask.publicId, {
          clientVersion: latest.version,
          payload: JSON.stringify(answerDraft),
          confidence: answerConfidence,
        }, key)
        : Promise.reject(new PracticeApiErrorClass(UI_TEXT.sessionError, 0, "SESSION_UNAVAILABLE"));
    });
  }

  async function skip() {
    const session = state.session;
    const currentTask = session?.currentTask;
    if (!session || !currentTask) return;
    await runMutation(`skip:${currentTask.publicId}`, (key) => {
      const latest = sessionRef.current;
      return latest
        ? api.skip(latest.publicId, currentTask.publicId, latest.version, key)
        : Promise.reject(new PracticeApiErrorClass(UI_TEXT.sessionError, 0, "SESSION_UNAVAILABLE"));
    });
  }

  async function saveAndExit() {
    const session = sessionRef.current ?? state.session;
    if (!session) return;
    const currentTask = session.currentTask;
    const savedDraft = currentTask
      ? effectiveDraft(currentTask, draftTaskId, draft)
      : {};
    const savedConfidence = currentTask
      ? effectiveConfidence(currentTask, draftTaskId, confidence)
      : null;
    const draftRequest = currentTask && hasAnswer(savedDraft)
      ? { itemPublicId: currentTask.publicId, payload: JSON.stringify(savedDraft), confidence: savedConfidence }
      : undefined;
    await runMutation(`exit:${currentTask?.publicId ?? "overview"}`,
      (key) => {
        const latest = sessionRef.current;
        return latest
          ? api.saveAndExit(latest.publicId, latest.version, draftRequest, key)
          : Promise.reject(new PracticeApiErrorClass(UI_TEXT.sessionError, 0, "SESSION_UNAVAILABLE"));
      },
      (next) => dispatch({ type: "exited", session: next }));
  }

  async function runMutation(scope: string, action: (idempotencyKey: string) => Promise<PracticeSession>,
    onSuccess: (session: PracticeSession) => void = (next) => dispatch({ type: "mutation_succeeded", session: next })) {
    const idempotencyKey = mutationKeys.current.get(scope) ?? createPracticeIdempotencyKey(scope);
    mutationKeys.current.set(scope, idempotencyKey);
    const retry = async () => {
      mutationInFlight.current = true;
      dispatch({ type: "mutation_started" });
      try {
        const pendingHeartbeat = heartbeatPromise.current;
        if (pendingHeartbeat && !(await pendingHeartbeat)) await reloadAfterHeartbeatFailure();
        if (heartbeatSyncRequired.current) await reloadAfterHeartbeatFailure();
        const next = await action(idempotencyKey);
        mutationKeys.current.delete(scope);
        retryMutation.current = null;
        setHasRetryAction(false);
        sessionRef.current = next;
        onSuccess(next);
      } catch (reason) {
        retryMutation.current = retry;
        setHasRetryAction(true);
        dispatch({ type: "failed", message: sessionErrorMessage(reason) });
      } finally {
        mutationInFlight.current = false;
      }
    };
    retryMutation.current = retry;
    await retry();
  }

  async function reloadAfterHeartbeatFailure() {
    const session = sessionRef.current;
    if (!session) throw new PracticeApiErrorClass(UI_TEXT.sessionError, 0, "SESSION_UNAVAILABLE");
    const latest = await api.getSession(session.publicId);
    sessionRef.current = latest;
    heartbeatSyncRequired.current = false;
    dispatch({ type: "received", session: latest });
  }

  function retry() {
    if (retryMutation.current) {
      void retryMutation.current();
      return;
    }
    initialized.current = null;
    dispatch({ type: "loading" });
    setRetryCount((value) => value + 1);
  }

  if (state.phase === "loading") return <SessionLoading />;
  if (state.phase === "error") {
    return (
      <section className="session-state-card" data-testid="practice-session-error">
        <AppIcon name="info" size={28} />
        <h1>Something went wrong</h1>
        <p>{state.error ?? UI_TEXT.sessionError}</p>
        <div className="session-actions"><button className="button button-primary" type="button" onClick={retry}>{hasRetryAction ? "Retry action" : "Try again"}</button>
          <button className="text-button" type="button" onClick={() => router.push(PRACTICE_ROUTES.home)}>Back home</button></div>
      </section>
    );
  }
  if (state.phase === "exited") {
    return (
      <section className="session-state-card" data-testid="practice-session-exited">
        <AppIcon name="check" size={28} />
        <h1>{state.session?.status === "EXPIRED" ? UI_TEXT.sessionExpired
          : state.session?.status === "DISCARDED" ? "No progress saved"
            : UI_TEXT.sessionProgressSaved}</h1>
        <p>{state.session?.status === "EXPIRED" ? UI_TEXT.sessionExpired
          : state.session?.status === "DISCARDED" ? "You can start a new practice session whenever you are ready."
            : "Your draft is available when you resume this session."}</p>
        <button className="button button-primary" type="button" onClick={() => router.push(PRACTICE_ROUTES.home)}>Back home</button>
      </section>
    );
  }

  const session = state.session;
  if (!session) return null;
  if (state.phase === "overview") return <SessionOverview session={session} busy={false} onBegin={begin} onExit={saveAndExit} />;
  if (state.phase === "completed") {
    return (
      <section className="session-state-card" data-testid="practice-session-complete">
        <AppIcon name="check" size={28} />
        <h1>{UI_TEXT.sessionCompleted}</h1>
        <p>You answered {session.answeredItemCount} of {session.totalItemCount} tasks.</p>
        <button className="button button-primary" type="button" onClick={() => router.push(PRACTICE_ROUTES.home)}>Back home</button>
      </section>
    );
  }

  const currentTask = session.currentTask;
  if (!currentTask) return <SessionLoading />;
  const fixture = fixtureForTask(currentTask.taskCode);
  const unsupported = !isInteractiveRenderer(currentTask.rendererKey);
  const currentDraft = effectiveDraft(currentTask, draftTaskId, draft);
  const currentConfidence = effectiveConfidence(currentTask, draftTaskId, confidence);
  return (
    <section className="practice-session" data-testid="practice-session">
      <div className="session-progress-row">
        <button className="icon-button" type="button" aria-label="Exit practice session" onClick={saveAndExit}>×</button>
        <div className="session-progress"><span style={{ width: `${progressFor(session)}%` }} /></div>
        <span className="session-counter">{currentTaskPosition(session)}/{session.totalItemCount}</span>
      </div>
      <div className="session-task-header">
        <div><span className="eyebrow">{currentTask.section}</span><h1>{currentTask.displayName}</h1><p>{fixture.instruction ?? "Answer the task below."}</p></div>
        <div className="session-timer" aria-label="Time remaining">{formatRemaining(session.deadlineAt, clockNow)}</div>
      </div>
      <div className="session-task-card">
        <p className="session-task-prompt">{fixture.prompt}</p>
        <TaskRenderer fixture={fixture} rendererKey={currentTask.rendererKey} value={currentDraft}
          disabled={state.phase === "submitting" || unsupported}
          onChange={(value) => { setDraftTaskId(currentTask.publicId); setDraft(value); }} />
      </div>
      {!unsupported ? (
        <div className="confidence-panel">
          <p>{UI_TEXT.sessionConfidence}</p>
          <div className="confidence-options" role="radiogroup">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
              <button key={level} type="button" role="radio" aria-checked={currentConfidence === level}
                className={`confidence-option confidence-${level.toLowerCase()}${currentConfidence === level ? " confidence-selected" : ""}`}
                disabled={state.phase === "submitting"} onClick={() => { setDraftTaskId(currentTask.publicId); setConfidence(level); }}>{level.charAt(0)}{level.slice(1).toLowerCase()} confidence</button>
            ))}
          </div>
        </div>
      ) : null}
      {state.error ? <p className="inline-notice" role="alert">{state.error}</p> : null}
      <div className="session-footer-actions">
        <button className="text-button" type="button" disabled={state.phase === "submitting"} onClick={saveAndExit}>{UI_TEXT.sessionSaveExit}</button>
        <div className="session-primary-actions">
          <button className="button button-muted" type="button" disabled={state.phase === "submitting"} onClick={skip}>{UI_TEXT.sessionSkip}</button>
          <button className="button button-primary" type="button" disabled={state.phase === "submitting" || unsupported} onClick={submit}>{UI_TEXT.sessionSubmit}</button>
        </div>
      </div>
    </section>
  );
}

function SessionOverview({ session, busy, onBegin, onExit }: {
  session: PracticeSession;
  busy: boolean;
  onBegin: () => Promise<void>;
  onExit: () => Promise<void>;
}) {
  return (
    <section className="session-overview" data-testid="practice-session-overview">
      <div className="session-overview-mark"><AppIcon name="practice" size={32} /></div>
      <span className="eyebrow">{session.productCode}</span>
      <h1>{session.title}</h1>
      <p>{UI_TEXT.sessionOverview}</p>
      <div className="session-overview-stats"><span><strong>{session.totalItemCount || "Selected"}</strong><small>tasks in this session</small></span><span><strong>{Math.round(session.timeLimitSeconds / 60)} min</strong><small>time limit</small></span></div>
      <div className="session-actions"><button className="button button-primary" type="button" disabled={busy} onClick={() => void onBegin()}>{UI_TEXT.sessionNext}</button>
        <button className="text-button" type="button" disabled={busy} onClick={() => void onExit()}>{UI_TEXT.sessionSaveExit}</button></div>
    </section>
  );
}

function SessionLoading() {
  return <section className="session-state-card" role="status"><span className="loading-dot" /><p>{UI_TEXT.sessionLoading}</p></section>;
}

function parsePayload(payload: string | null): Record<string, unknown> {
  if (!payload) return {};
  try {
    const value: unknown = JSON.parse(payload);
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function effectiveDraft(task: { publicId: string; savedPayload: string | null }, draftTaskId: string | null,
  draft: Record<string, unknown>): Record<string, unknown> {
  return draftTaskId === task.publicId ? draft : parsePayload(task.savedPayload);
}

function effectiveConfidence(task: { publicId: string; confidence: ResponseConfidence | null },
  draftTaskId: string | null, confidence: ResponseConfidence | null): ResponseConfidence | null {
  return draftTaskId === task.publicId ? confidence : task.confidence;
}

function hasAnswer(value: Record<string, unknown>): boolean {
  return Object.values(value).some((entry) => Array.isArray(entry) ? entry.length > 0
    : typeof entry === "object" && entry !== null ? Object.keys(entry).length > 0
      : typeof entry === "string" && entry.trim().length > 0);
}

function isInteractiveRenderer(rendererKey: string | null): boolean {
  return isClientRuntimeSupported(rendererKey);
}

function progressFor(session: PracticeSession): number {
  if (!session.totalItemCount) return 4;
  if (session.status === "COMPLETED") return 100;
  const position = session.currentTask ? session.currentTask.orderIndex / session.totalItemCount : 0;
  return Math.min(100, Math.max(4, position * 100));
}

function currentTaskPosition(session: PracticeSession): number {
  if (!session.currentTask) return session.totalItemCount;
  return Math.min(session.totalItemCount, session.currentTask.orderIndex + 1);
}

function formatRemaining(deadlineAt: string | null, now = Date.now()): string {
  if (!deadlineAt) return "--:--";
  const seconds = Math.max(0, Math.round((new Date(deadlineAt).getTime() - now) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function sessionErrorMessage(reason: unknown): string {
  const error = reason as PracticeApiError | undefined;
  if (error?.status === 409 || error?.code === "PRACTICE_STALE_SESSION_VERSION") return UI_TEXT.sessionConflict;
  if (error?.status === 410 || error?.code === "PRACTICE_SESSION_EXPIRED") return UI_TEXT.sessionExpired;
  return error?.message || UI_TEXT.sessionError;
}
