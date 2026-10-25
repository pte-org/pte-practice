"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "@/common/i18n";
import { createPracticeApiClient, PracticeApiError } from "./api";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeSession } from "./contracts";
import { uploadPracticeRecording } from "./media/api";
import { INITIAL_PRACTICE_SESSION_STATE, practiceSessionReducer } from "./session-state";
import { clearPracticeDraft } from "./session-storage";
import { fixtureFromPracticeTask } from "./task-content";
import { effectiveConfidence, effectiveDraft, hasAnswer, sessionErrorMessage } from "./session/session-draft";
import { SessionResultCard, type AnsweredResult } from "./session/SessionResultCard";
import {
  SessionCompleteCard, SessionErrorCard, SessionExitedCard, SessionLoading,
} from "./session/SessionStateCards";
import { SessionTaskView, type MissingField } from "./session/SessionTaskView";
import { useHeartbeat } from "./session/useHeartbeat";
import { useSessionDraft } from "./session/useSessionDraft";
import { useSessionLifecycle } from "./session/useSessionLifecycle";
import { useSessionMutations } from "./session/useSessionMutations";

export function PracticeSessionView() {
  const router = useRouter();
  const { t } = useTranslation();
  const api = useMemo(() => createPracticeApiClient(), []);
  const [state, dispatch] = useReducer(practiceSessionReducer, INITIAL_PRACTICE_SESSION_STATE);
  const [answered, setAnswered] = useState<AnsweredResult | null>(null);
  const [missing, setMissing] = useState<MissingField>(null);
  const sessionRef = useRef<PracticeSession | null>(null);
  const { draft, draftTaskId, confidence, hydrateDraft, editAnswer, chooseConfidence } = useSessionDraft();

  const errorMessage = useCallback((reason: unknown) => sessionErrorMessage(reason, {
    conflict: t("ui.sessionConflict"), expired: t("ui.sessionExpired"), fallback: t("ui.sessionError"),
  }), [t]);
  const heartbeat = useHeartbeat({ api, phase: state.phase, sessionRef, dispatch, errorMessage });
  const { runMutation, runBackgroundMutation, retryLastMutation, hasRetryAction } = useSessionMutations({
    api, dispatch, sessionRef, heartbeat, hydrateDraft, errorMessage, unavailableMessage: t("ui.sessionError"),
  });
  const resetScreen = useCallback(() => {
    // This view stays mounted across tasks; the previous task's score must not leak into the next session.
    setAnswered(null);
    setMissing(null);
  }, []);
  const { reload } = useSessionLifecycle({
    api, dispatch, hydrateDraft, onReset: resetScreen, errorMessage,
    accessLockedMessage: t("ui.accessLocked"), unsupportedMessage: t("ui.sessionUnsupported"),
  });

  useEffect(() => {
    sessionRef.current = state.session;
  }, [state.session]);

  const sessionTask = state.session?.currentTask;
  const fixture = useMemo(() => sessionTask ? fixtureFromPracticeTask(sessionTask) : null, [sessionTask]);
  const goHome = () => router.push(PRACTICE_ROUTES.home);
  const unavailable = () => Promise.reject(new PracticeApiError(t("ui.sessionError"), 0, "SESSION_UNAVAILABLE"));

  const begin = () => runMutation("begin", (key) => sessionRef.current
    ? api.beginSession(sessionRef.current.publicId, sessionRef.current.version, key) : unavailable());

  const overviewSessionId = state.phase === "overview" ? state.session?.publicId : undefined;
  const beganFor = useRef<string | null>(null);
  useEffect(() => {
    if (!overviewSessionId || beganFor.current === overviewSessionId) return;
    beganFor.current = overviewSessionId;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- begin only reads refs and stable callbacks; it runs once per session
  }, [overviewSessionId]);

  const saveAndExit = () => {
    const session = sessionRef.current ?? state.session;
    if (!session) return Promise.resolve();
    const task = session.currentTask;
    const savedDraft = task ? effectiveDraft(task, draftTaskId, draft) : {};
    const draftRequest = task && hasAnswer(savedDraft) ? {
      itemPublicId: task.publicId, payload: JSON.stringify(savedDraft),
      confidence: effectiveConfidence(task, draftTaskId, confidence),
    } : undefined;
    return runMutation(`exit:${task?.publicId ?? "overview"}`, (key) => sessionRef.current
      ? api.saveAndExit(sessionRef.current.publicId, sessionRef.current.version, draftRequest, key) : unavailable(),
    (next) => dispatch({ type: "exited", session: next }));
  };

  const skip = () => {
    const session = state.session;
    const task = session?.currentTask;
    if (!session || !task) return Promise.resolve();
    return runMutation(`skip:${task.publicId}`, (key) => sessionRef.current
      ? api.skip(sessionRef.current.publicId, task.publicId, sessionRef.current.version, key) : unavailable(),
    (next) => {
      clearPracticeDraft(session.publicId, task.publicId);
      dispatch({ type: "mutation_succeeded", session: next });
    });
  };

  const submit = () => {
    const session = state.session;
    const task = session?.currentTask;
    if (!session || !task) return Promise.resolve();
    const answerDraft = effectiveDraft(task, draftTaskId, draft);
    const answerConfidence = effectiveConfidence(task, draftTaskId, confidence);
    // Missing input is a warning on the form, not a failed session: the student keeps their draft and fixes it in place.
    if (!hasAnswer(answerDraft)) { setMissing("answer"); return Promise.resolve(); }
    if (!answerConfidence) { setMissing("confidence"); return Promise.resolve(); }
    setMissing(null);
    return runMutation(`answer:${task.publicId}`, (key) => sessionRef.current
      ? api.answer(sessionRef.current.publicId, task.publicId, {
        clientVersion: sessionRef.current.version, payload: JSON.stringify(answerDraft), confidence: answerConfidence,
      }, key) : unavailable(),
    (next) => {
      clearPracticeDraft(session.publicId, task.publicId);
      if (next.itemResult) setAnswered({ itemPublicId: task.publicId, displayName: task.displayName, result: next.itemResult });
      dispatch({ type: "mutation_succeeded", session: next });
    });
  };

  /** Uploads a recording, then saves it on the session so it can be replayed after a reload. A failed save is not fatal:
   *  the recording stays in memory and is saved again with the answer. */
  const uploadAndSaveRecording = async (blob: Blob, durationSeconds: number) => {
    const session = sessionRef.current ?? state.session;
    const task = session?.currentTask;
    if (!session || !task) return Promise.reject(new PracticeApiError(t("ui.sessionError"), 0, "SESSION_UNAVAILABLE"));
    const media = await uploadPracticeRecording(api, blob, session.publicId, task.publicId, durationSeconds);
    const saved = await runBackgroundMutation(`draft:${task.publicId}:${media.mediaPublicId}`, (key) => sessionRef.current
      ? api.saveDraft(sessionRef.current.publicId, task.publicId, {
        clientVersion: sessionRef.current.version,
        payload: JSON.stringify({ mediaPublicId: media.mediaPublicId, durationSeconds: media.durationSeconds }),
        confidence: effectiveConfidence(task, draftTaskId, confidence),
      }, key) : unavailable());
    if (!saved.ok) throw new PracticeApiError(errorMessage(saved.reason), 0, "DRAFT_SAVE_FAILED");
    return media;
  };

  const refreshPrompt = async () => {
    const current = sessionRef.current ?? state.session;
    if (!current) return;
    const latest = await api.getSession(current.publicId);
    sessionRef.current = latest;
    dispatch({ type: "received", session: latest });
  };

  const retry = () => { if (!retryLastMutation()) reload(); };

  const session = state.session;
  if (state.phase === "loading") return <SessionLoading />;
  if (state.phase === "error") {
    return <SessionErrorCard message={state.error} hasRetryAction={hasRetryAction} onRetry={retry} onBackHome={goHome} />;
  }
  if (state.phase === "exited") return <SessionExitedCard session={session} onBackHome={goHome} />;
  if (!session) return null;
  if (answered) {
    return <SessionResultCard api={api} sessionPublicId={session.publicId} answered={answered}
      onContinue={() => setAnswered(null)} />;
  }
  // A new session starts straight away: the mode was chosen before it was created, so there is no overview step.
  if (state.phase === "overview") return <SessionLoading />;
  if (state.phase === "completed") {
    return <SessionCompleteCard session={session} onBackHome={goHome}
      onReview={() => router.push(`${PRACTICE_ROUTES.practiceReview}?sessionId=${session.publicId}`)} />;
  }
  const task = session.currentTask;
  if (!task) return <SessionLoading />;

  return (
    <SessionTaskView session={session} task={task} fixture={fixture} busy={state.phase === "submitting"}
      notice={state.error} missing={missing} value={effectiveDraft(task, draftTaskId, draft)}
      confidence={effectiveConfidence(task, draftTaskId, confidence)}
      onChange={(value) => { setMissing(null); editAnswer(session.publicId, task.publicId, value); }}
      onConfidence={(level) => { setMissing(null); chooseConfidence(task.publicId, level); }}
      onUploadRecording={uploadAndSaveRecording}
      onLoadPlayback={() => api.getRecordingPlayback(session.publicId, task.publicId).then((playback) => playback.url)}
      onRefreshPrompt={refreshPrompt}
      onSubmit={submit} onSkip={skip} onSaveExit={saveAndExit} />
  );
}
