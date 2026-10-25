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
import type { PracticeItemResult, PracticeSession, PracticeTaskResponse } from "./contracts";
import type { PracticeTaskFixture } from "./fixtures";
import { uploadPracticeRecording } from "./media/api";
import { INITIAL_PRACTICE_SESSION_STATE, practiceSessionReducer } from "./session-state";
import { clearPracticeDraft, getPracticeDraft } from "./session-storage";
import { fixtureFromPracticeTask } from "./task-content";
import { effectiveDraft, hasAnswer, parsePayload, sessionErrorMessage } from "./session/session-draft";
import {
  SessionCompleteCard, SessionErrorCard, SessionLoading,
} from "./session/SessionStateCards";
import { SessionTaskView, type MissingField } from "./session/SessionTaskView";
import { useHeartbeat } from "./session/useHeartbeat";
import { useSessionDraft } from "./session/useSessionDraft";
import { useSessionLifecycle } from "./session/useSessionLifecycle";
import { useSessionMutations } from "./session/useSessionMutations";

interface HistoryItem {
  task: PracticeTaskResponse;
  fixture: PracticeTaskFixture | null;
  answer: Record<string, unknown>;
  result: PracticeItemResult | null;
  timeSpentSeconds: number;
  isSkipped?: boolean;
}

interface CurrentAnswered {
  task: PracticeTaskResponse;
  fixture: PracticeTaskFixture | null;
  answer: Record<string, unknown>;
  result: PracticeItemResult;
  timeSpentSeconds: number;
  nextSession: PracticeSession;
}

export function PracticeSessionView() {
  const router = useRouter();
  const { t } = useTranslation();
  const api = useMemo(() => createPracticeApiClient(), []);
  const [state, dispatch] = useReducer(practiceSessionReducer, INITIAL_PRACTICE_SESSION_STATE);
  const [currentAnswered, setCurrentAnswered] = useState<CurrentAnswered | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState<number | null>(null);
  const [missing, setMissing] = useState<MissingField>(null);
  const sessionRef = useRef<PracticeSession | null>(null);
  const questionStartTime = useRef<number>(0);
  const { draft, draftTaskId, setDraft, setDraftTaskId, hydrateDraft, editAnswer } = useSessionDraft();
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
    setCurrentAnswered(null);
    setHistory([]);
    setViewingHistoryIndex(null);
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

  const currentTaskId = state.session?.currentTask?.publicId;
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentTaskId]);

  const sessionTask = state.session?.currentTask;
  const fixture = useMemo(() => sessionTask ? fixtureFromPracticeTask(sessionTask) : null, [sessionTask]);
  const activeTask = viewingHistoryIndex !== null
    ? history[viewingHistoryIndex]?.task ?? sessionTask
    : (currentAnswered ? currentAnswered.task : sessionTask);
  const activeFixture = viewingHistoryIndex !== null
    ? history[viewingHistoryIndex]?.fixture ?? fixture
    : (currentAnswered ? currentAnswered.fixture : fixture);

  useEffect(() => {
    const session = state.session;
    if (!session || !activeTask) return;
    const local = getPracticeDraft(session.publicId, activeTask.publicId);
    if (local) {
      setDraftTaskId(activeTask.publicId);
      setDraft(local.payload);
    } else {
      setDraftTaskId(activeTask.publicId);
      setDraft(parsePayload(activeTask.savedPayload));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-hydrate when switching to a different task or session
  }, [state.session?.publicId, activeTask?.publicId, setDraft, setDraftTaskId]);

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
    const task = activeTask;
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
    const start = questionStartTime.current || Date.now();
    const timeSpent = Math.max(1, Math.round((Date.now() - start) / 1000));
    return runMutation(`skip:${task.publicId}`, (key) => sessionRef.current
      ? api.skip(sessionRef.current.publicId, task.publicId, sessionRef.current.version, key) : unavailable(),
    (next) => {
      clearPracticeDraft(session.publicId, task.publicId);
      setHistory((prev) => [
        ...prev,
        {
          task,
          fixture,
          answer: {},
          result: null,
          timeSpentSeconds: timeSpent,
          isSkipped: true,
        },
      ]);
      setDraft({});
      setDraftTaskId(next.currentTask?.publicId ?? null);
      dispatch({ type: "mutation_succeeded", session: next });
    });
  };

  /** Submits; a written answer outside its word range is confirmed first unless `confirmed`. */
  const submit = (confirmed = false) => {
    const session = state.session;
    const task = activeTask;
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
    const start = questionStartTime.current || Date.now();
    const timeSpent = Math.max(1, Math.round((Date.now() - start) / 1000));
    return runMutation(`answer:${task.publicId}`, (key) => sessionRef.current
      ? api.answer(sessionRef.current.publicId, task.publicId, {
        clientVersion: sessionRef.current.version, payload: JSON.stringify(answerDraft), confidence: null,
      }, key) : unavailable(),
    (next) => {
      clearPracticeDraft(session.publicId, task.publicId);
      const newResult: PracticeItemResult = next.itemResult ?? {
        itemPublicId: task.publicId,
        taskCode: task.taskCode,
        state: "SCORED",
        score: 0,
        scoreStatus: null,
        subScores: {},
        feedback: null,
        transcript: null,
        failureCode: null,
        retryable: false,
        scoredAt: null,
      };

      if (viewingHistoryIndex !== null) {
        setHistory((prev) => prev.map((item, idx) => idx === viewingHistoryIndex ? {
          ...item,
          answer: answerDraft,
          result: newResult,
          isSkipped: false,
          timeSpentSeconds: timeSpent,
        } : item));
        sessionRef.current = next;
        dispatch({ type: "mutation_succeeded", session: next });
      } else {
        setCurrentAnswered({
          task,
          fixture: activeFixture,
          answer: answerDraft,
          result: newResult,
          timeSpentSeconds: timeSpent,
          nextSession: next,
        });
        sessionRef.current = next;
        dispatch({ type: "mutation_succeeded", session: next });
      }
    });
  };

  const handleResultSettled = useCallback((settledResult: PracticeItemResult) => {
    if (viewingHistoryIndex !== null) {
      setHistory((prev) => prev.map((item, idx) => idx === viewingHistoryIndex ? {
        ...item,
        result: settledResult,
      } : item));
    } else {
      setCurrentAnswered((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          result: settledResult,
        };
      });
    }
  }, [viewingHistoryIndex]);

  const handleNext = () => {
    // 1. If viewing history, navigate forward until returning to current question
    if (viewingHistoryIndex !== null) {
      if (viewingHistoryIndex < history.length - 1) {
        setViewingHistoryIndex(viewingHistoryIndex + 1);
      } else {
        setViewingHistoryIndex(null);
      }
      return;
    }

    // 2. If current task is already submitted and showing inline result, advance to next question
    if (currentAnswered) {
      const finishedItem: HistoryItem = {
        task: currentAnswered.task,
        fixture: currentAnswered.fixture,
        answer: currentAnswered.answer,
        result: currentAnswered.result,
        timeSpentSeconds: currentAnswered.timeSpentSeconds,
        isSkipped: false,
      };
      setHistory((prev) => [...prev, finishedItem]);
      const next = currentAnswered.nextSession ?? sessionRef.current ?? state.session;
      if (next) {
        sessionRef.current = next;
      }
      setCurrentAnswered(null);
      setViewingHistoryIndex(null);
      setDraft({});
      setDraftTaskId(next?.currentTask?.publicId ?? null);
      return;
    }

    // 3. Current question not submitted yet: Next acts as skip
    setConfirm("skip");
  };

  const handleSubmitAnswer = () => {
    void submit();
  };

  const handlePrev = () => {
    if (viewingHistoryIndex !== null) {
      if (viewingHistoryIndex > 0) {
        setViewingHistoryIndex(viewingHistoryIndex - 1);
      }
    } else if (history.length > 0) {
      setViewingHistoryIndex(history.length - 1);
    }
  };

  /** Uploads a recording, then saves it on the session so it can be replayed after a reload. A failed save is not fatal:
   *  the recording stays in memory and is saved again with the answer. */
  const uploadAndSaveRecording = async (blob: Blob, durationSeconds: number) => {
    const session = sessionRef.current ?? state.session;
    const task = activeTask;
    if (!session || !task) return Promise.reject(new PracticeApiError(t("ui.sessionError"), 0, "SESSION_UNAVAILABLE"));
    const media = await uploadPracticeRecording(api, blob, session.publicId, task.publicId, durationSeconds);
    const saved = await runBackgroundMutation(`draft:${task.publicId}:${media.mediaPublicId}`, (key) => sessionRef.current
      ? api.saveDraft(sessionRef.current.publicId, task.publicId, {
        clientVersion: sessionRef.current.version,
        payload: JSON.stringify({ mediaPublicId: media.mediaPublicId, durationSeconds: media.durationSeconds }),
        confidence: null,
      }, key) : unavailable());
    if (!saved.ok) throw new PracticeApiError(errorMessage(saved.reason), 0, "DRAFT_SAVE_FAILED");
    editAnswer(session.publicId, task.publicId, { mediaPublicId: media.mediaPublicId, durationSeconds: media.durationSeconds });
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
  const currentTask = activeTask;
  if (!currentTask) return <SessionLoading />;

  const activeHistoryItem = viewingHistoryIndex !== null ? history[viewingHistoryIndex] : null;
  const isItemScored = activeHistoryItem ? activeHistoryItem.result !== null : false;
  const isViewingOrSubmitted = viewingHistoryIndex !== null ? isItemScored : currentAnswered !== null;
  const isScoring = (currentAnswered !== null && currentAnswered.result.state === "SCORING")
    || (activeHistoryItem !== null && activeHistoryItem.result?.state === "SCORING");

  const activeValue = viewingHistoryIndex !== null && activeHistoryItem
    ? (isItemScored ? activeHistoryItem.answer : effectiveDraft(currentTask, draftTaskId, draft))
    : (currentAnswered ? currentAnswered.answer : effectiveDraft(currentTask, draftTaskId, draft));
  const activeResult = viewingHistoryIndex !== null && activeHistoryItem
    ? activeHistoryItem.result
    : (currentAnswered ? currentAnswered.result : null);
  const activeTimeSpent = viewingHistoryIndex !== null && activeHistoryItem
    ? activeHistoryItem.timeSpentSeconds
    : (currentAnswered ? currentAnswered.timeSpentSeconds : undefined);

  let showSubmit = false;
  let showNext = false;
  let showSkip = false;
  let showPrev = false;
  let prevDisabled = false;

  if (viewingHistoryIndex !== null) {
    showPrev = true;
    prevDisabled = viewingHistoryIndex === 0;
    if (isItemScored) {
      showSkip = false;
      showSubmit = false;
      showNext = !isScoring && state.phase !== "submitting";
    } else {
      const currentDraft = effectiveDraft(currentTask, draftTaskId, draft);
      const hasUserAnswer = hasAnswer(currentDraft);
      if (hasUserAnswer) {
        showSubmit = true;
        showSkip = false;
        showNext = false;
      } else {
        showSubmit = false;
        showSkip = false;
        showNext = true;
      }
    }
  } else if (currentAnswered !== null) {
    showPrev = history.length > 0;
    showSkip = false;
    showSubmit = false;
    // Show Next only when scoring is settled, hide while scoring or submitting
    showNext = !isScoring && state.phase !== "submitting";
  } else {
    const currentDraft = effectiveDraft(currentTask, draftTaskId, draft);
    const hasUserAnswer = hasAnswer(currentDraft);
    if (hasUserAnswer) {
      showPrev = history.length > 0;
      showSkip = false;
      showSubmit = true;
      showNext = false;
    } else {
      showPrev = history.length > 0;
      showSkip = true;
      showSubmit = false;
      showNext = false;
    }
  }

  const title = sessionDisplayName(session, (code) => (code === currentTask.taskCode ? currentTask.displayName : code), t);

  const hasSpeaking = session.sections.some((section) => section.code === "SPEAKING");
  const hasAudio = hasSpeaking || session.sections.some((section) => section.code === "LISTENING");
  // Speaker first, then the microphone; closing the mic check without recording is allowed, it is guidance only.
  const showAudioCheck = hasAudio && !checksDone.includes("speaker");
  const showMicCheck = hasSpeaking && !showAudioCheck && !checksDone.includes("mic");
  const closeConfirm = () => setConfirm(null);

  return (
    <>
      <SessionTaskView
        key={currentTask.publicId}
        api={api}
        session={session}
        task={currentTask}
        fixture={activeFixture}
        title={title}
        busy={state.phase === "submitting"}
        recorderBusy={recorderBusy}
        offline={!online}
        notice={state.error}
        missing={missing}
        value={activeValue}
        isSubmitted={isViewingOrSubmitted}
        result={activeResult}
        timeSpentSeconds={activeTimeSpent}
        onResultSettled={handleResultSettled}
        showPrev={showPrev}
        onPrev={handlePrev}
        prevDisabled={prevDisabled}
        showSkip={showSkip}
        onSkip={() => setConfirm("skip")}
        showSubmit={showSubmit}
        submitDisabled={state.phase === "submitting"}
        submitLabel={t("session.submitAnswer")}
        onSubmitAnswer={handleSubmitAnswer}
        showNext={showNext}
        nextLabel={t("session.next")}
        onChange={(value) => {
          if (!isViewingOrSubmitted) {
            setMissing(null);
            editAnswer(session.publicId, currentTask.publicId, value);
          }
        }}
        onUploadRecording={uploadAndSaveRecording}
        onLoadPlayback={() => api.getRecordingPlayback(session.publicId, currentTask.publicId).then((playback) => playback.url)}
        onActivityChange={setRecorderBusy}
        onRefreshPrompt={refreshPrompt}
        onSubmit={handleNext}
        onPause={() => setConfirm("pause")}
      />
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
