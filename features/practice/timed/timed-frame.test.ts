import { describe, expect, it } from "vitest";
import type { PracticeItemTiming } from "../session-contracts";
import { answerLocked, currentStepId, recordCommand, shouldMountTimedFrame, stepperStepIds } from "./timed-frame";

const TIMING: PracticeItemTiming = { preListenSeconds: null, preRecordSeconds: 10, responseSeconds: 40 };
const task = (timing: PracticeItemTiming | null) => ({ timing }) as never;

describe("shouldMountTimedFrame", () => {
  it("is true only for a timed session whose item has timing", () => {
    expect(shouldMountTimedFrame({ timingMode: "TIMED", currentTask: task(TIMING) })).toBe(true);
    expect(shouldMountTimedFrame({ timingMode: "UNTIMED", currentTask: task(TIMING) })).toBe(false);
    expect(shouldMountTimedFrame({ timingMode: "TIMED", currentTask: task(null) })).toBe(false);
    expect(shouldMountTimedFrame({ timingMode: "TIMED", currentTask: null })).toBe(false);
    expect(shouldMountTimedFrame({ timingMode: undefined as never, currentTask: task(TIMING) })).toBe(false);
  });
});

describe("stepper helpers", () => {
  it("adds a done step for speaking only", () => {
    expect(stepperStepIds(["prep", "recording"], true)).toEqual(["prep", "recording", "done"]);
    expect(stepperStepIds(["answering"], false)).toEqual(["answering"]);
  });

  it("maps phases to the current step", () => {
    expect(currentStepId({ phase: "saving", plan: ["recording"] })).toBe("done");
    expect(currentStepId({ phase: "gate", plan: ["prep", "recording"] })).toBe("prep");
    expect(currentStepId({ phase: "timeUp", plan: ["answering"] })).toBe("answering");
    expect(currentStepId({ phase: "prep", plan: ["prep", "recording"] })).toBe("prep");
  });
});

describe("recorder and answer control", () => {
  it("starts the recorder once the recording phase is reached and stops it when saving", () => {
    expect(recordCommand({ phase: "recording", recordStarted: false })).toBe("start");
    expect(recordCommand({ phase: "recording", recordStarted: true })).toBeNull();
    expect(recordCommand({ phase: "saving", recordStarted: true })).toBe("stop");
    expect(recordCommand({ phase: "prep", recordStarted: false })).toBeNull();
  });

  it("locks non-speaking answers outside the response phase", () => {
    expect(answerLocked("answering", false)).toBe(false);
    expect(answerLocked("prompt", false)).toBe(true);
    expect(answerLocked("timeUp", false)).toBe(true);
    expect(answerLocked("gate", true)).toBe(false);
  });
});
