import type { PracticeSession } from "../session-contracts";
import type { TimedPhaseId, TimedState, TimedStepId } from "./timed-phase";

/** The timed frame (clock, stepper, locked prompt) is mounted only for a timed session whose item has pinned timing. */
export function shouldMountTimedFrame(session: Pick<PracticeSession, "timingMode" | "currentTask">): boolean {
  return session.timingMode === "TIMED" && Boolean(session.currentTask?.timing);
}

/** Steps shown in the stepper: the plan, plus a final "done" for speaking tasks. */
export function stepperStepIds(plan: readonly TimedStepId[], isSpeaking: boolean): string[] {
  return isSpeaking ? [...plan, "done"] : [...plan];
}

/** Which stepper step is current for a phase; waiting/error phases stay on the step they interrupted. */
export function currentStepId(state: Pick<TimedState, "phase" | "plan">): string {
  const phase: TimedPhaseId = state.phase;
  if (phase === "saving" || phase === "saveFailed" || phase === "done") return "done";
  if (phase === "timeUp") return "answering";
  if (phase === "gate" || phase === "idle" || phase === "error") return state.plan[0] ?? "answering";
  return phase;
}

/** The recorder should start the microphone now: recording phase reached, microphone not yet open. */
export function recordCommand(state: Pick<TimedState, "phase" | "recordStarted">): "start" | "stop" | null {
  if (state.phase === "recording" && !state.recordStarted) return "start";
  if (state.phase === "saving") return "stop";
  return null;
}

/** Non-speaking answers can be edited only while the response clock runs. */
export function answerLocked(phase: TimedPhaseId, isSpeaking: boolean): boolean {
  return !isSpeaking && phase !== "answering";
}
