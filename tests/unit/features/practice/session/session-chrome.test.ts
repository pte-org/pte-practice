import { describe, expect, it } from "vitest";
import { sessionParts, shouldWarnOnLeave } from "@/features/practice/session/session-chrome";

const sections = ["SPEAKING", "WRITING", "READING", "LISTENING"].map((code) => ({ code })) as never;

describe("sessionParts", () => {
  it("marks earlier parts done and the current part by the current task's skill", () => {
    const parts = sessionParts({ sections, status: "IN_PROGRESS", currentTask: { section: "READING" } } as never);
    expect(parts.partNumber).toBe(3);
    expect(parts.partCount).toBe(4);
    expect(parts.segments).toEqual([
      { done: true, current: false }, { done: true, current: false },
      { done: false, current: true }, { done: false, current: false },
    ]);
  });

  it("has one part for a single-skill session and all parts done when completed", () => {
    expect(sessionParts({ sections: [{ code: "READING" }], status: "IN_PROGRESS", currentTask: { section: "READING" } } as never))
      .toMatchObject({ partNumber: 1, partCount: 1 });
    const done = sessionParts({ sections, status: "COMPLETED", currentTask: null } as never);
    expect(done.segments.every((segment) => segment.done)).toBe(true);
    expect(done.partNumber).toBe(4);
  });
});

describe("shouldWarnOnLeave", () => {
  it("warns only while the recorder is busy", () => {
    expect(shouldWarnOnLeave(true)).toBe(true);
    expect(shouldWarnOnLeave(false)).toBe(false);
  });
});
