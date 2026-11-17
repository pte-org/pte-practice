import { describe, expect, it } from "vitest";
import { recordingIssue, recordingReviewIssue, wordCountIssue } from "@/features/practice/answer-checks";

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

describe("recordingReviewIssue", () => {
  it("makes an untimed silent or very short take wait for the learner to keep or redo it", () => {
    expect(recordingReviewIssue(false, 0.5, 0.2)).toBe("short");
    expect(recordingReviewIssue(false, 5, 0.005)).toBe("silent");
    expect(recordingReviewIssue(false, 5, 0.2)).toBeNull();
  });

  it("never holds back a timed take, whatever it sounds like", () => {
    expect(recordingReviewIssue(true, 0.5, 0)).toBeNull();
    expect(recordingReviewIssue(true, 5, 0.005)).toBeNull();
  });
});

