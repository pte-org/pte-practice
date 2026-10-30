import type { PracticeItemTiming } from "../session-contracts";

/**
 * Pure state machine for one timed question. Deadlines are wall-clock timestamps computed from the `now` each event
 * carries, never decremented per tick, so a throttled tab cannot make the question last longer.
 */
export type TimedStepId = "preListen" | "prompt" | "prep" | "recording" | "answering";
export type TimedPhaseId = TimedStepId | "idle" | "gate" | "saving" | "saveFailed" | "done" | "error" | "timeUp";

export interface PhasePlanInput {
  timing: PracticeItemTiming;
  isSpeaking: boolean;
  hasPromptAudio: boolean;
}

export interface TimedState {
  phase: TimedPhaseId;
  /** Epoch ms the current phase ends at; null while nothing is counting (prompt playing, waiting for the mic). */
  deadlineMs: number | null;
  plan: readonly TimedStepId[];
  responseSeconds: number;
  preListenSeconds: number;
  preRecordSeconds: number;
  /** The browser has not had a user gesture yet, so audio cannot start until "Start question" is pressed. */
  needsGate: boolean;
  /** The recording has actually begun (the microphone is open); the response clock starts then. */
  recordStarted: boolean;
}

export type TimedEvent =
  | { type: "START"; now: number }
  | { type: "ACTIVATED"; now: number }
  | { type: "ACTIVATION_LOST" }
  | { type: "TICK"; now: number }
  | { type: "PROMPT_ENDED"; now: number }
  | { type: "RECORD_STARTED"; now: number }
  | { type: "STOP_EARLY" }
  | { type: "SAVED" }
  | { type: "SAVE_FAILED" }
  | { type: "MIC_ERROR" }
  | { type: "RETRY_ITEM"; now: number };

/** Steps this question goes through, in order; steps of zero length (and a missing prompt) are left out. */
export function buildPhasePlan({ timing, isSpeaking, hasPromptAudio }: PhasePlanInput): TimedStepId[] {
  const plan: TimedStepId[] = [];
  if (isSpeaking && (timing.preListenSeconds ?? 0) > 0) plan.push("preListen");
  if (hasPromptAudio) plan.push("prompt");
  if (isSpeaking && timing.preRecordSeconds > 0) plan.push("prep");
  plan.push(isSpeaking ? "recording" : "answering");
  return plan;
}

export interface InitialTimedOptions extends PhasePlanInput {
  hasSavedRecording: boolean;
  needsGate: boolean;
}

/** A question that already has a saved recording reopens as done; anything else starts over from the first step. */
export function initialTimedState(options: InitialTimedOptions): TimedState {
  const { timing, hasSavedRecording, needsGate, isSpeaking } = options;
  return {
    phase: isSpeaking && hasSavedRecording ? "done" : "idle",
    deadlineMs: null,
    plan: buildPhasePlan(options),
    responseSeconds: timing.responseSeconds,
    preListenSeconds: timing.preListenSeconds ?? 0,
    preRecordSeconds: timing.preRecordSeconds,
    needsGate,
    recordStarted: false,
  };
}

function enter(state: TimedState, step: TimedStepId | undefined, now: number): TimedState {
  if (!step) return state;
  const base: TimedState = { ...state, phase: step, recordStarted: false };
  if (step === "preListen") return { ...base, deadlineMs: now + state.preListenSeconds * 1000 };
  if (step === "prep") return { ...base, deadlineMs: now + state.preRecordSeconds * 1000 };
  if (step === "answering") return { ...base, deadlineMs: now + state.responseSeconds * 1000 };
  return { ...base, deadlineMs: null };
}

function advance(state: TimedState, now: number): TimedState {
  const index = state.plan.indexOf(state.phase as TimedStepId);
  const next = state.plan[index + 1];
  if (next) return enter(state, next, now);
  return state.phase === "answering" ? { ...state, phase: "timeUp", deadlineMs: null } : state;
}

function begin(state: TimedState, now: number): TimedState {
  return state.needsGate
    ? { ...state, phase: "gate", deadlineMs: null, recordStarted: false }
    : enter(state, state.plan[0], now);
}

const FINISHED: readonly TimedPhaseId[] = ["done", "saving", "saveFailed"];
const COUNTING: readonly TimedPhaseId[] = ["preListen", "prompt", "prep", "recording"];

export function timedReducer(state: TimedState, event: TimedEvent): TimedState {
  switch (event.type) {
    case "START":
      return state.phase === "idle" ? begin(state, event.now) : state;
    case "ACTIVATED":
      return state.phase === "gate" ? { ...enter(state, state.plan[0], event.now), needsGate: false } : state;
    case "ACTIVATION_LOST":
      // Audio was blocked mid-way: stop the clock and ask for a gesture again. A recording in progress is not affected.
      return COUNTING.includes(state.phase) && !state.recordStarted
        ? { ...state, phase: "gate", deadlineMs: null, needsGate: true } : state;
    case "TICK": {
      if (state.deadlineMs === null || event.now < state.deadlineMs) return state;
      if (state.phase === "recording") return { ...state, phase: "saving", deadlineMs: null };
      return state.phase === "preListen" || state.phase === "prep" || state.phase === "answering"
        ? advance(state, event.now) : state;
    }
    case "PROMPT_ENDED":
      return state.phase === "prompt" ? advance(state, event.now) : state;
    case "RECORD_STARTED":
      return state.phase === "recording" && !state.recordStarted
        ? { ...state, recordStarted: true, deadlineMs: event.now + state.responseSeconds * 1000 } : state;
    case "STOP_EARLY":
      return state.phase === "recording" && state.recordStarted ? { ...state, phase: "saving", deadlineMs: null } : state;
    case "SAVED":
      return state.phase === "saving" || state.phase === "saveFailed" ? { ...state, phase: "done", deadlineMs: null } : state;
    case "SAVE_FAILED":
      return state.phase === "saving" ? { ...state, phase: "saveFailed", deadlineMs: null } : state;
    case "MIC_ERROR":
      return FINISHED.includes(state.phase) || state.phase === "idle" || state.phase === "error"
        ? state : { ...state, phase: "error", deadlineMs: null, recordStarted: false };
    case "RETRY_ITEM":
      // Only a failure before anything was saved can be retried; a saved recording is never recorded again.
      return state.phase === "error" ? begin({ ...state, phase: "idle" }, event.now) : state;
  }
}

/** Length of the current phase in seconds, for the countdown ring. */
export function phaseTotalSeconds(state: TimedState): number {
  if (state.phase === "preListen") return state.preListenSeconds;
  if (state.phase === "prep") return state.preRecordSeconds;
  return state.responseSeconds;
}
