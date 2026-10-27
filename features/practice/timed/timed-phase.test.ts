import { describe, expect, it } from "vitest";
import type { PracticeItemTiming } from "../session-contracts";
import {
  buildPhasePlan, initialTimedState, timedReducer, type TimedEvent, type TimedState,
} from "./timed-phase";

const REPEAT: PracticeItemTiming = { preListenSeconds: 3, preRecordSeconds: 3, responseSeconds: 15 };
const READ_ALOUD: PracticeItemTiming = { preListenSeconds: null, preRecordSeconds: 35, responseSeconds: 40 };
const LISTENING: PracticeItemTiming = { preListenSeconds: null, preRecordSeconds: 0, responseSeconds: 20 };
const T0 = 1_000_000;

function run(state: TimedState, ...events: TimedEvent[]): TimedState {
  return events.reduce(timedReducer, state);
}

function speaking(timing: PracticeItemTiming, hasPromptAudio: boolean, needsGate = false): TimedState {
  return initialTimedState({ timing, isSpeaking: true, hasPromptAudio, hasSavedRecording: false, needsGate });
}

function listening(hasPromptAudio: boolean): TimedState {
  return initialTimedState({ timing: LISTENING, isSpeaking: false, hasPromptAudio, hasSavedRecording: false, needsGate: false });
}

describe("buildPhasePlan", () => {
  it("lists the steps of each task kind and skips zero-length ones", () => {
    expect(buildPhasePlan({ timing: REPEAT, isSpeaking: true, hasPromptAudio: true }))
      .toEqual(["preListen", "prompt", "prep", "recording"]);
    expect(buildPhasePlan({ timing: READ_ALOUD, isSpeaking: true, hasPromptAudio: false })).toEqual(["prep", "recording"]);
    expect(buildPhasePlan({ timing: { ...READ_ALOUD, preRecordSeconds: 0 }, isSpeaking: true, hasPromptAudio: false }))
      .toEqual(["recording"]);
    expect(buildPhasePlan({ timing: LISTENING, isSpeaking: false, hasPromptAudio: true })).toEqual(["prompt", "answering"]);
  });
});

describe("speaking flow", () => {
  it("runs Repeat Sentence 3/3/15 and starts the response clock when recording really starts", () => {
    let state = run(speaking(REPEAT, true), { type: "START", now: T0 });
    expect(state).toMatchObject({ phase: "preListen", deadlineMs: T0 + 3000 });
    expect(timedReducer(state, { type: "TICK", now: T0 + 2999 }).phase).toBe("preListen");
    state = run(state, { type: "TICK", now: T0 + 3000 });
    expect(state).toMatchObject({ phase: "prompt", deadlineMs: null });
    state = run(state, { type: "PROMPT_ENDED", now: T0 + 9000 });
    expect(state).toMatchObject({ phase: "prep", deadlineMs: T0 + 12000 });
    state = run(state, { type: "TICK", now: T0 + 12000 });
    expect(state).toMatchObject({ phase: "recording", deadlineMs: null, recordStarted: false });
    state = run(state, { type: "RECORD_STARTED", now: T0 + 12500 });
    expect(state.deadlineMs).toBe(T0 + 12500 + 15000);
    expect(timedReducer(state, { type: "TICK", now: T0 + 27499 }).phase).toBe("recording");
    expect(timedReducer(state, { type: "TICK", now: T0 + 27500 }).phase).toBe("saving");
  });

  it("goes straight to prep for Read Aloud, which has no prompt audio", () => {
    const state = run(speaking(READ_ALOUD, false), { type: "START", now: T0 });
    expect(state).toMatchObject({ phase: "prep", deadlineMs: T0 + 35000 });
  });

  it("stops early, saves, and then ignores anything that would record again", () => {
    let state = run(speaking(READ_ALOUD, false), { type: "START", now: T0 }, { type: "TICK", now: T0 + 35000 },
      { type: "RECORD_STARTED", now: T0 + 35100 }, { type: "STOP_EARLY" });
    expect(state.phase).toBe("saving");
    state = run(state, { type: "SAVED" });
    expect(state.phase).toBe("done");
    expect(run(state, { type: "START", now: T0 }, { type: "RETRY_ITEM", now: T0 }, { type: "MIC_ERROR" }, { type: "STOP_EARLY" }))
      .toEqual(state);
  });

  it("ignores an early stop before the microphone is open", () => {
    const state = run(speaking(READ_ALOUD, false), { type: "START", now: T0 }, { type: "TICK", now: T0 + 35000 });
    expect(timedReducer(state, { type: "STOP_EARLY" })).toEqual(state);
  });

  it("reports a microphone failure and starts the question over on retry", () => {
    const failed = run(speaking(REPEAT, true), { type: "START", now: T0 }, { type: "TICK", now: T0 + 3000 }, { type: "MIC_ERROR" });
    expect(failed).toMatchObject({ phase: "error", deadlineMs: null });
    expect(run(failed, { type: "RETRY_ITEM", now: T0 + 50_000 })).toMatchObject({ phase: "preListen", deadlineMs: T0 + 53_000 });
  });

  it("keeps the recording when saving fails and never goes back to recording", () => {
    const failed = run(speaking(READ_ALOUD, false), { type: "START", now: T0 }, { type: "TICK", now: T0 + 35000 },
      { type: "RECORD_STARTED", now: T0 + 35100 }, { type: "STOP_EARLY" }, { type: "SAVE_FAILED" });
    expect(failed.phase).toBe("saveFailed");
    expect(run(failed, { type: "RETRY_ITEM", now: T0 }, { type: "RECORD_STARTED", now: T0 }).phase).toBe("saveFailed");
    expect(run(failed, { type: "SAVED" }).phase).toBe("done");
  });
});

describe("reopening a question", () => {
  it("opens as done when a recording was saved, and starts over otherwise", () => {
    const saved = initialTimedState({ timing: REPEAT, isSpeaking: true, hasPromptAudio: true, hasSavedRecording: true, needsGate: true });
    expect(saved.phase).toBe("done");
    expect(speaking(REPEAT, true).phase).toBe("idle");
  });
});

describe("the start gate", () => {
  it("waits for a gesture on every speaking task, including ones without prompt audio", () => {
    for (const [timing, audio] of [[REPEAT, true], [READ_ALOUD, false]] as const) {
      const gated = run(speaking(timing, audio, true), { type: "START", now: T0 });
      expect(gated).toMatchObject({ phase: "gate", deadlineMs: null });
      expect(run(gated, { type: "ACTIVATED", now: T0 + 4000 }).phase).toBe(audio ? "preListen" : "prep");
    }
  });

  it("returns to the gate when audio is blocked while counting or waiting for the mic", () => {
    const prompt = run(speaking(REPEAT, true), { type: "START", now: T0 }, { type: "TICK", now: T0 + 3000 });
    expect(run(prompt, { type: "ACTIVATION_LOST" })).toMatchObject({ phase: "gate", deadlineMs: null, needsGate: true });
    const waiting = run(speaking(READ_ALOUD, false), { type: "START", now: T0 }, { type: "TICK", now: T0 + 35000 });
    expect(run(waiting, { type: "ACTIVATION_LOST" }).phase).toBe("gate");
  });

  it("does not interrupt a recording that is already running", () => {
    const recording = run(speaking(READ_ALOUD, false), { type: "START", now: T0 }, { type: "TICK", now: T0 + 35000 },
      { type: "RECORD_STARTED", now: T0 + 35100 });
    expect(timedReducer(recording, { type: "ACTIVATION_LOST" })).toEqual(recording);
  });
});

describe("non-speaking tasks", () => {
  it("plays the prompt, then counts the response time and locks the answer at zero", () => {
    let state = run(listening(true), { type: "START", now: T0 }, { type: "PROMPT_ENDED", now: T0 + 8000 });
    expect(state).toMatchObject({ phase: "answering", deadlineMs: T0 + 28_000 });
    expect(timedReducer(state, { type: "TICK", now: T0 + 27_999 }).phase).toBe("answering");
    state = run(state, { type: "TICK", now: T0 + 28_000 });
    expect(state).toMatchObject({ phase: "timeUp", deadlineMs: null });
  });

  it("starts counting at once when there is no prompt audio", () => {
    expect(run(listening(false), { type: "START", now: T0 })).toMatchObject({ phase: "answering", deadlineMs: T0 + 20_000 });
  });
});
