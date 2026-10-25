import { describe, expect, it } from "vitest";
import { recordingIssue, wordCountIssue } from "./answer-checks";

describe("wordCountIssue", () => {
  it("flags answers under the minimum or over the maximum", () => {
    expect(wordCountIssue(42, 200, 300)).toBe("under");
    expect(wordCountIssue(301, 200, 300)).toBe("over");
    expect(wordCountIssue(250, 200, 300)).toBeNull();
    expect(wordCountIssue(10, null, null)).toBeNull();
  });
});

describe("recordingIssue", () => {
  it("flags very short and silent recordings", () => {
    expect(recordingIssue(0.5, 0.2)).toBe("short");
    expect(recordingIssue(5, 0.005)).toBe("silent");
    expect(recordingIssue(5, 0.2)).toBeNull();
  });
});
