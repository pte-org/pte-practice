"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AppIcon, CountdownTimer, Stepper, useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import type { TimedRendererControl } from "../renderers/RendererTypes";
import type { PracticeItemTiming } from "../session-contracts";
import { createOnceCommand } from "./play-once";
import { answerLocked, currentStepId, recordCommand, stepperStepIds } from "./timed-frame";
import { phaseTotalSeconds } from "./timed-phase";
import { useTimedPhase } from "./useTimedPhase";

const STEP_LABELS: Record<string, TranslationKey> = {
  preListen: "timed.stepPreListen",
  prompt: "timed.stepPrompt",
  prep: "timed.stepPrep",
  recording: "timed.stepRecording",
  answering: "timed.stepAnswering",
  done: "timed.stepDone",
};

interface TimedTaskFrameProps {
  timing: PracticeItemTiming;
  isSpeaking: boolean;
  hasPromptAudio: boolean;
  hasSavedRecording: boolean;
  /** Reloads the session to get a fresh prompt link; called at most once when the prompt fails to load. */
  onRefreshPrompt: () => Promise<void>;
  children: (view: { timed: TimedRendererControl; locked: boolean; attempt: number }) => ReactNode;
}

/** Clock, stepper and controls of one timed question; the renderer is drawn by `children` with the control to use. */
export function TimedTaskFrame(props: TimedTaskFrameProps) {
  const { timing, isSpeaking, hasPromptAudio, hasSavedRecording, onRefreshPrompt, children } = props;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { state, dispatch } = useTimedPhase({ timing, isSpeaking, hasPromptAudio, hasSavedRecording });
  const [attempt, setAttempt] = useState(0);
  // One fresh prompt link is tried per run; the command object lives in state so event handlers can use it.
  const [promptRefresh] = useState(createOnceCommand);
  const { phase } = state;

  useEffect(() => {
    if (phase === "timeUp") {
      showToast(t("timed.timeUp"), { tone: "warning" });
    }
  }, [phase, showToast, t]);

  const timed = useMemo<TimedRendererControl>(() => ({
    playPrompt: phase === "prompt",
    recordCommand: recordCommand(state),
    maxSeconds: state.responseSeconds,
    onPromptEnded: () => dispatch({ type: "PROMPT_ENDED", now: Date.now() }),
    onPromptBlocked: () => dispatch({ type: "ACTIVATION_LOST" }),
    onPromptError: () => {
      // If the prompt still cannot load after one refresh, carry on without it rather than stall the clock.
      if (promptRefresh.fire()) void onRefreshPrompt().catch(() => dispatch({ type: "PROMPT_ENDED", now: Date.now() }));
      else dispatch({ type: "PROMPT_ENDED", now: Date.now() });
    },
    onRecordStarted: () => dispatch({ type: "RECORD_STARTED", now: Date.now() }),
    onSaved: () => dispatch({ type: "SAVED" }),
    onSaveFailed: () => dispatch({ type: "SAVE_FAILED" }),
    onMicError: () => dispatch({ type: "MIC_ERROR" }),
  }), [dispatch, onRefreshPrompt, phase, promptRefresh, state]);

  const steps = stepperStepIds(state.plan, isSpeaking).map((id) => ({ id, label: t(STEP_LABELS[id]) }));
  const counting = state.deadlineMs !== null;

  return (
    <div className="timed-frame" data-testid="timed-frame">
      <div className="timed-frame-bar">
        <Stepper steps={steps} currentStep={currentStepId(state)} label={t("timed.stepperLabel")} />
        {counting ? (
          <CountdownTimer deadlineMs={state.deadlineMs} totalSeconds={phaseTotalSeconds(state)} size="md"
            label={t("timed.clockLabel")} warningText={t("timed.clockWarning")} />
        ) : null}
      </div>
      {phase === "gate" ? (
        <div className="timed-gate">
          <p>{t("timed.startQuestionHint")}</p>
          <button className="button button-outline button-pill" type="button"
            onClick={() => dispatch({ type: "ACTIVATED", now: Date.now() })}>
            <AppIcon name="play" size={18} /> {t("timed.startQuestion")}
          </button>
        </div>
      ) : null}
      {phase === "prompt" ? <p className="timed-frame-note" role="status">{t("timed.promptPlaying")}</p> : null}
      {phase === "error" ? (
        <div className="timed-gate">
          <p role="alert">{t("timed.micFailed")}</p>
          <button className="button button-outline button-pill" type="button" onClick={() => {
            setAttempt((value) => value + 1);
            promptRefresh.reset();
            dispatch({ type: "RETRY_ITEM", now: Date.now() });
          }}>
            <AppIcon name="retake" size={18} /> {t("timed.retryQuestion")}
          </button>
        </div>
      ) : null}
      {children({ timed, locked: answerLocked(phase, isSpeaking), attempt })}
      {phase === "recording" && state.recordStarted ? (
        <div className="timed-frame-actions">
          <button className="button button-muted" type="button" onClick={() => dispatch({ type: "STOP_EARLY" })}>
            <AppIcon name="stop" size={18} /> {t("timed.stopEarly")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
