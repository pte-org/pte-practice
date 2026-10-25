import { describe, expect, it } from "vitest";
import { practiceMockTestUrl, practiceSessionUrl, practiceSkillSessionUrl } from "./practice-url";

describe("practiceSessionUrl", () => {
  it("carries the task, the timing mode and the question count", () => {
    expect(practiceSessionUrl("READ_ALOUD", { timingMode: "TIMED", questionCount: 5 }))
      .toBe("/practice-tests/session?task=READ_ALOUD&mode=TIMED&count=5");
  });

  it("encodes the untimed all-questions choice", () => {
    expect(practiceSessionUrl("WRITE_ESSAY", { timingMode: "UNTIMED", questionCount: 50 }))
      .toBe("/practice-tests/session?task=WRITE_ESSAY&mode=UNTIMED&count=50");
  });
});

describe("practiceSkillSessionUrl", () => {
  it("carries the skill instead of a task", () => {
    expect(practiceSkillSessionUrl("READING", { timingMode: "UNTIMED", questionCount: 10 }))
      .toBe("/practice-tests/session?skill=READING&mode=UNTIMED&count=10");
  });
});

describe("practiceMockTestUrl", () => {
  it("opens a mock test, and marks a restart", () => {
    expect(practiceMockTestUrl("abc")).toBe("/practice-tests/session?mockTest=abc");
    expect(practiceMockTestUrl("abc", true)).toBe("/practice-tests/session?mockTest=abc&restart=1");
  });
});
