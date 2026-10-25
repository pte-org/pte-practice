import { describe, expect, it } from "vitest";
import { continueHref, sessionAverageScore } from "./complete-actions";

describe("continueHref", () => {
  it("restarts the same task type or skill untimed with the default count", () => {
    expect(continueHref({ kind: "TASK", skillCode: null, taskCode: "READ_ALOUD" }))
      .toBe("/practice-tests/session?task=READ_ALOUD&mode=UNTIMED&count=10");
    expect(continueHref({ kind: "SKILL", skillCode: "READING", taskCode: null }))
      .toBe("/practice-tests/session?skill=READING&mode=UNTIMED&count=10");
  });

  it("has no action after a mock test or without the data", () => {
    expect(continueHref({ kind: "MOCK_TEST", skillCode: null, taskCode: null })).toBeNull();
    expect(continueHref({ kind: "TASK", skillCode: null, taskCode: null })).toBeNull();
  });
});

describe("sessionAverageScore", () => {
  it("averages the scores that exist", () => {
    expect(sessionAverageScore([80, null, 60])).toBe(70);
    expect(sessionAverageScore([])).toBeNull();
    expect(sessionAverageScore([null])).toBeNull();
  });
});
