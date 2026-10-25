"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ConfirmDialog, useToast } from "@/common/components";
import { useOnlineStatus } from "@/common/hooks/useOnlineStatus";
import { useTranslation } from "@/common/i18n";
import { AudioPlaybackCheckDialog } from "@/features/deviceCheck/AudioPlaybackCheckDialog";
import { DeviceCheckDialog } from "@/features/deviceCheck/DeviceCheckDialog";
import type { DeviceCheckKind } from "@/features/deviceCheck/device-check";
import { useDeviceChecks } from "@/features/deviceCheck/useDeviceChecks";
import { wordCountIssue } from "./answer-checks";
import { countPracticeWords } from "./media/text-utils";
import { sessionDisplayName } from "./presentation";
import { useLeaveGuard } from "./session/useLeaveGuard";
import { createPracticeApiClient, PracticeApiError } from "./api";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeSession } from "./contracts";
import { uploadPracticeRecording } from "./media/api";
import { INITIAL_PRACTICE_SESSION_STATE, practiceSessionReducer } from "./session-state";
import { clearPracticeDraft } from "./session-storage";
import { fixtureFromPracticeTask } from "./task-content";
import { effectiveDraft, hasAnswer, sessionErrorMessage } from "./session/session-draft";
import {
  SessionCompleteCard, SessionErrorCard, SessionLoading,
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
  const [missing, setMissing] = useState<MissingField>(null);
  const sessionRef = useRef<PracticeSession | null>(null);
  const { draft, draftTaskId, hydrateDraft, editAnswer } = useSessionDraft();
  const { showToast } = useToast();
  const online = useOnlineStatus();
  const { markPassed } = useDeviceChecks();
  const [recorderBusy, setRecorderBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "pause" | "skip" | { words: number; min: number | null; max: number | null }>(null);
  /** Device checks done since this session was opened; starting or resuming a session asks again. */
  const [checksDone, setChecksDone] = useState<DeviceCheckKind[]>([]);
  const finishCheck = (kind: DeviceCheckKind) => setChecksDone((done) => (done.includes(kind) ? done : [...done, kind]));
  useLeaveGuard(recorderBusy);
  const wasOnline = useRef(online);
  useEffect(() => {
    if (wasOnline.current === online) return;
    wasOnline.current = online;
    showToast(online ? t("session.online") : t("session.offline"), { tone: online ? "success" : "warning" });
  }, [online, showToast, t]);

  const errorMessage = useCallback((reason: unknown) => sessionErrorMessage(reason, {
    conflict: t("ui.sessionConflict"), expired: t("ui.sessionExpired"), fallback: t("ui.sessionError"),
  }), [t]);
  const heartbeat = useHeartbeat({ api, phase: state.phase, sessionRef, dispatch, errorMessage });
  const { runMutation, runBackgroundMutation, retryLastMutation, hasRetryAction } = useSessionMutations({
    api, dispatch, sessionRef, heartbeat, hydrateDraft, errorMessage, unavailableMessage: t("ui.sessionError"),
    onConflict: () => showToast(t("session.conflict"), { tone: "warning" }),
  });
  const resetScreen = useCallback(() => {
    // This view stays mounted across tasks; the previous task's warning must not leak into the next session.
    setMissing(null);
    setChecksDone([]);
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
      itemPublicId: task.publicId, payload: JSON.stringify(savedDraft), confidence: null,
    } : undefined;
    return runMutation(`exit:${task?.publicId ?? "overview"}`, (key) => sessionRef.current
      ? api.saveAndExit(sessionRef.current.publicId, sessionRef.current.version, draftRequest, key) : unavailable(),
    (next) => {
      dispatch({ type: "exited", session: next });
      router.replace(PRACTICE_ROUTES.home);
    });
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

  /** Submits; a written answer outside its word range is confirmed first unless `confirmed`. */
  const submit = (confirmed = false) => {
    const session = state.session;
    const task = session?.currentTask;
    if (!session || !task) return Promise.resolve();
    const answerDraft = effectiveDraft(task, draftTaskId, draft);
    // Missing input is a warning on the form, not a failed session: the student keeps their draft and fixes it in place.
    if (!hasAnswer(answerDraft)) { setMissing("answer"); return Promise.resolve(); }
    setMissing(null);
    const content = task.content;
    if (!confirmed && typeof answerDraft.text === "string" && content) {
      const words = countPracticeWords(answerDraft.text);
      if (wordCountIssue(words, content.minWordCount, content.maxWordCount)) {
        setConfirm({ words, min: content.minWordCount, max: content.maxWordCount });
        return Promise.resolve();
      }
    }
    return runMutation(`answer:${task.publicId}`, (key) => sessionRef.current
      ? api.answer(sessionRef.current.publicId, task.publicId, {
        clientVersion: sessionRef.current.version, payload: JSON.stringify(answerDraft), confidence: null,
      }, key) : unavailable(),
    (next) => {
      // Scores are shown only once the whole session is done (complete card and review), so go straight on.
      clearPracticeDraft(session.publicId, task.publicId);
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
        confidence: null,
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
  // Pausing goes straight back home (see saveAndExit); the session stays resumable from Home and Progress.
  if (state.phase === "exited") return <SessionLoading />;
  if (!session) return null;
  // A new session starts straight away: the mode was chosen before it was created, so there is no overview step.
  if (state.phase === "overview") return <SessionLoading />;
  if (state.phase === "completed") {
    return <SessionCompleteCard session={session} api={api} onBackHome={goHome}
      onReview={() => router.push(`${PRACTICE_ROUTES.practiceReview}?sessionId=${session.publicId}`)} />;
  }
  const task = session.currentTask;
  if (!task) return <SessionLoading />;

  const title = sessionDisplayName(session, (code) => (code === task.taskCode ? task.displayName : code), t);
  const hasSpeaking = session.sections.some((section) => section.code === "SPEAKING");
  const hasAudio = hasSpeaking || session.sections.some((section) => section.code === "LISTENING");
  // Speaker first, then the microphone; closing the mic check without recording is allowed, it is guidance only.
  const showAudioCheck = hasAudio && !checksDone.includes("speaker");
  const showMicCheck = hasSpeaking && !showAudioCheck && !checksDone.includes("mic");
  const closeConfirm = () => setConfirm(null);

  return (
    <>
      <SessionTaskView session={session} task={task} fixture={fixture} title={title} busy={state.phase === "submitting"}
        recorderBusy={recorderBusy} offline={!online}
        notice={state.error} missing={missing} value={effectiveDraft(task, draftTaskId, draft)}
        onChange={(value) => { setMissing(null); editAnswer(session.publicId, task.publicId, value); }}
        onUploadRecording={uploadAndSaveRecording}
        onLoadPlayback={() => api.getRecordingPlayback(session.publicId, task.publicId).then((playback) => playback.url)}
        onActivityChange={setRecorderBusy}
        onRefreshPrompt={refreshPrompt}
        onSubmit={() => void submit()} onSkip={() => setConfirm("skip")} onPause={() => setConfirm("pause")} />
      <ConfirmDialog open={confirm === "pause"} title={t("session.pauseTitle")} description={t("session.pauseDescription")}
        confirmLabel={t("session.pauseConfirm")} cancelLabel={t("session.cancel")}
        onClose={closeConfirm} onConfirm={() => { closeConfirm(); void saveAndExit(); }} />
      <ConfirmDialog open={confirm === "skip"} tone="warning" title={t("session.skipTitle")} description={t("session.skipDescription")}
        confirmLabel={t("session.skip")} cancelLabel={t("session.cancel")}
        onClose={closeConfirm} onConfirm={() => { closeConfirm(); void skip(); }} />
      {confirm !== null && typeof confirm === "object" ? (
        <ConfirmDialog open tone="warning" title={t("session.wordsTitle").replace("{n}", String(confirm.words))}
          description={t("session.wordsDescription").replace("{min}", String(confirm.min ?? 0))
            .replace("{max}", String(confirm.max ?? "∞")).replace("{n}", String(confirm.words))}
          confirmLabel={t("session.submitAnyway")} cancelLabel={t("session.cancel")}
          onClose={closeConfirm} onConfirm={() => { closeConfirm(); void submit(true); }} />
      ) : null}
      <AudioPlaybackCheckDialog open={showAudioCheck} onConfirm={() => { markPassed("speaker"); finishCheck("speaker"); }} />
      <DeviceCheckDialog kind={showMicCheck ? "mic" : null} onClose={() => finishCheck("mic")} onPassed={markPassed} />
    </>
  );
}
