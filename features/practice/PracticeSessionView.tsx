"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ConfirmDialog, useToast } from "@/common/components";
import { useOnlineStatus } from "@/common/hooks/useOnlineStatus";
import { useTranslation } from "@/common/i18n";
import { ChatLayout } from "@/features/chat/ChatLayout";
import { wordCountIssue } from "./answer-checks";
import { countPracticeWords } from "./media/text-utils";
import { sessionDisplayName } from "./presentation";
import { useLeaveGuard } from "./session/useLeaveGuard";
import { createPracticeApiClient, PracticeApiError } from "./api";
import { MOCK_TEST_KIND, PRACTICE_ROUTES } from "./constants";
import type { PracticeItemResult, PracticeSession, PracticeTaskResponse } from "./contracts";
import type { PracticeTaskFixture } from "./fixtures";
import { uploadPracticeRecording } from "./media/api";
import { createRecordingCommitter } from "./media/recordingDrafts";
import { createRecordingDraftSaver } from "./session/recordingCommit";
import { INITIAL_PRACTICE_SESSION_STATE, practiceSessionReducer } from "./session-state";
import { fixtureFromPracticeTask } from "./task-content";
import { effectiveDraft, hasAnswer, parsePayload, sessionErrorMessage } from "./session/session-draft";
import {
  SessionCompleteCard, SessionErrorCard, SessionLoading,
} from "./session/SessionStateCards";
import { FinishSessionButton } from "./session/FinishSessionButton";
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
  const { draft, draftTaskId, setDraft, setDraftTaskId, hydrateDraft, editAnswer, readDraft, forgetDraft,
    recordingDrafts, hasRecordingDrafts } = useSessionDraft();
  const [commitRecording] = useState(createRecordingCommitter);
  const [saveRecordingDrafts] = useState(createRecordingDraftSaver);
  const { showToast } = useToast();
  const online = useOnlineStatus();
  const [recorderBusy, setRecorderBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "pause" | { words: number; min: number | null; max: number | null }>(null);
  useLeaveGuard(recorderBusy || hasRecordingDrafts, () => showToast(t("session.exitBeforeLeaving"), { tone: "warning" }));
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
  const { runMutation, retryLastMutation, hasRetryAction } = useSessionMutations({
    api, dispatch, sessionRef, heartbeat, hydrateDraft, errorMessage, unavailableMessage: t("ui.sessionError"),
    onConflict: () => showToast(t("session.conflict"), { tone: "warning" }),
  });
  const hydratedSessionId = useRef<string | null>(null);
  const resetScreen = useCallback(() => {
    // This view stays mounted across tasks; the previous task's warning must not leak into the next session.
    setCurrentAnswered(null);
    setHistory([]);
    setViewingHistoryIndex(null);
    setMissing(null);
    hydratedSessionId.current = null;
  }, []);
  const { reload } = useSessionLifecycle({
    api, dispatch, hydrateDraft, onReset: resetScreen, errorMessage,
    accessLockedMessage: t("ui.accessLocked"), unsupportedMessage: t("ui.sessionUnsupported"),
  });

  useEffect(() => {
    sessionRef.current = state.session;
  }, [state.session]);

  // Hydrate history when resuming a session that already has answered or skipped questions
  useEffect(() => {
    const session = state.session;
    if (!session || hydratedSessionId.current === session.publicId) return;

    if (session.answeredItemCount > 0 || (session.currentTask && session.currentTask.orderIndex > 0)) {
      hydratedSessionId.current = session.publicId;
      void api.getReview(session.publicId).then((review) => {
        const completedItems = review.items.filter(
          (item) => item.status === "ANSWERED" || item.status === "SKIPPED"
        );
        if (completedItems.length === 0) return;

        const newHistory: HistoryItem[] = completedItems.map((item) => {
          const pastTask: PracticeTaskResponse = {
            publicId: item.publicId,
            orderIndex: item.orderIndex,
            taskCode: item.taskCode,
            displayName: item.displayName,
            section: item.section,
            rendererKey: item.rendererKey,
            contractVersion: 1,
            answerSchemaVersion: 1,
            status: item.status,
            savedPayload: item.savedPayload,
            confidence: null,
            content: {
              promptText: item.promptText,
              minWordCount: null,
              maxWordCount: null,
              audioPromptRef: null,
              imagePromptRef: null,
              options: item.options,
              audioUrl: null,
              imageUrl: null,
            },
            timing: null,
          };
          const pastFixture = fixtureFromPracticeTask(pastTask);
          const pastAnswer = parsePayload(item.savedPayload);
          const pastResult: PracticeItemResult | null = item.status === "ANSWERED" ? {
            itemPublicId: item.publicId,
            taskCode: item.taskCode,
            state: item.score !== null ? "SCORED" : "SCORING",
            score: item.score ?? 0,
            scoreStatus: null,
            subScores: {},
            feedback: null,
            transcript: null,
            failureCode: null,
            retryable: false,
            scoredAt: null,
          } : null;

          return {
            task: pastTask,
            fixture: pastFixture,
            answer: pastAnswer,
            result: pastResult,
            timeSpentSeconds: 0,
            isSkipped: item.status === "SKIPPED",
          };
        });

        setHistory((prev) => (prev.length === 0 ? newHistory : prev));
      }).catch(() => {
        // Non-fatal if review fetch fails
      });
    }
  }, [api, state.session]);

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
    const local = readDraft(session.publicId, activeTask.publicId);
    if (local) {
      setDraftTaskId(activeTask.publicId);
      setDraft(local.payload);
    } else {
      setDraftTaskId(activeTask.publicId);
      setDraft(parsePayload(activeTask.savedPayload));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-hydrate when switching to a different task or session
  }, [state.session?.publicId, activeTask?.publicId, setDraft, setDraftTaskId, readDraft]);

  const goHome = () => {
    if (hasRecordingDrafts || recorderBusy) {
      showToast(t("session.exitBeforeLeaving"), { tone: "warning" });
      return;
    }
    router.push(PRACTICE_ROUTES.home);
  };
  // Leaves without saving the answer in progress: unsaved recordings are dropped, earlier saved answers stay. A
  // session with nothing saved is dropped on the server too, so Home does not list it as in progress.
  const exitWithoutSaving = async () => {
    const session = sessionRef.current ?? state.session;
    if (session) for (const entry of recordingDrafts(session.publicId)) forgetDraft(session.publicId, entry.itemId);
    closeConfirm();
    // A failed discard only leaves the empty session listed; leaving must still work.
    if (session) await api.discardSession(session.publicId).catch(() => false);
    router.replace(PRACTICE_ROUTES.home);
  };
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
    return runMutation(`exit:${task?.publicId ?? "overview"}`, async (key) => {
      // Drafts from other visited items stay local until this explicit exit as well.
      await saveRecordingDrafts(api, recordingDrafts(session.publicId), task?.publicId, sessionRef, key, forgetDraft);
      const payload = task ? await commitRecording(savedDraft, (blob, duration) =>
        uploadPracticeRecording(api, blob, session.publicId, task.publicId, duration)) : {};
      const draftRequest = task && hasAnswer(payload) ? {
        itemPublicId: task.publicId, payload: JSON.stringify(payload), confidence: null,
      } : undefined;
      return sessionRef.current
        ? api.saveAndExit(sessionRef.current.publicId, sessionRef.current.version, draftRequest, key) : unavailable();
    },
    (next) => {
      for (const entry of recordingDrafts(session.publicId)) forgetDraft(session.publicId, entry.itemId);
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
      forgetDraft(session.publicId, task.publicId);
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
    let answerDraft = effectiveDraft(task, draftTaskId, draft);
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
    return runMutation(`answer:${task.publicId}`, async (key) => {
      await saveRecordingDrafts(api, recordingDrafts(session.publicId), task.publicId, sessionRef, key, forgetDraft);
      answerDraft = await commitRecording(answerDraft, (blob, duration) =>
        uploadPracticeRecording(api, blob, session.publicId, task.publicId, duration));
      return sessionRef.current ? api.answer(sessionRef.current.publicId, task.publicId, {
        clientVersion: sessionRef.current.version, payload: JSON.stringify(answerDraft), confidence: null,
      }, key) : unavailable();
    },
    (next) => {
      forgetDraft(session.publicId, task.publicId);
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
    void skip();
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
  if (state.phase === "completed" && !currentAnswered && viewingHistoryIndex === null) {
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

  const closeConfirm = () => setConfirm(null);

  return (
    <ChatLayout taskCode={currentTask.taskCode} exercisePrompt={activeFixture?.prompt}>
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
        onSkip={() => void skip()}
        showSubmit={showSubmit}
        submitDisabled={state.phase === "submitting"}
        submitLabel={t("session.submitAnswer")}
        onSubmitAnswer={handleSubmitAnswer}
        showNext={showNext}
        nextLabel={
          session.status === "COMPLETED" || currentAnswered?.nextSession?.status === "COMPLETED"
            ? t("score.continue")
            : t("session.next")
        }
        onChange={(value) => {
          if (!isViewingOrSubmitted) {
            setMissing(null);
            editAnswer(session.publicId, currentTask.publicId, value);
          }
        }}
        onLoadPlayback={() => api.getRecordingPlayback(session.publicId, currentTask.publicId).then((playback) => playback.url)}
        onActivityChange={setRecorderBusy}
        onRefreshPrompt={refreshPrompt}
        onSubmit={handleNext}
        onPause={() => {
          // Nothing done yet means nothing to save: leave at once (the server drops the empty session), no dialog.
          const untouched = session.answeredItemCount === 0 && !hasRecordingDrafts
            && !hasAnswer(effectiveDraft(currentTask, draftTaskId, draft));
          if (untouched) void exitWithoutSaving(); else setConfirm("pause");
        }}
        finishAction={session.kind === MOCK_TEST_KIND ? undefined : <FinishSessionButton api={api} sessionId={session.publicId}
          answeredCount={session.answeredItemCount} totalCount={session.totalItemCount} disabled={state.phase === "submitting" || recorderBusy || !online} />}
      />
      <ConfirmDialog open={confirm === "pause"} tone="accent" title={t("session.pauseTitle")} description={t("session.pauseDescription")}
        confirmLabel={t("session.pauseConfirm")} cancelLabel={t("session.exitWithoutSaving")} closeLabel={t("session.cancel")}
        onClose={closeConfirm} onCancel={() => void exitWithoutSaving()} onConfirm={() => { closeConfirm(); void saveAndExit(); }} />
      {confirm !== null && typeof confirm === "object" ? (
        <ConfirmDialog open tone="warning" title={t("session.wordsTitle").replace("{n}", String(confirm.words))}
          description={t("session.wordsDescription").replace("{min}", String(confirm.min ?? 0))
            .replace("{max}", String(confirm.max ?? "∞")).replace("{n}", String(confirm.words))}
          confirmLabel={t("session.submitAnyway")} cancelLabel={t("session.cancel")}
          onClose={closeConfirm} onConfirm={() => { closeConfirm(); void submit(true); }} />
      ) : null}
    </ChatLayout>
  );
}
