import { describe, expect, it } from "vitest";
import { normalizePracticeItemResult, normalizePracticeSessionResponse } from "./contracts";

const scored = {
  itemPublicId: "item-1",
  taskCode: "READ_ALOUD",
  state: "SCORED",
  score: 78,
  scoreStatus: "FALLBACK",
  subScores: { content: 80, fluency: 70, bad: "x" },
  feedback: "Good pace.",
  transcript: "regular practice helps",
  failureCode: null,
  retryable: false,
  scoredAt: "2026-10-24T01:00:00Z",
};

describe("practice item result contract", () => {
  it("normalizes a scored result and drops non-numeric sub scores", () => {
    expect(normalizePracticeItemResult(scored)).toEqual({
      itemPublicId: "item-1",
      taskCode: "READ_ALOUD",
      state: "SCORED",
      score: 78,
      scoreStatus: "FALLBACK",
      subScores: { content: 80, fluency: 70 },
      feedback: "Good pace.",
      transcript: "regular practice helps",
      failureCode: null,
      retryable: false,
      scoredAt: "2026-10-24T01:00:00Z",
    });
  });

  it("keeps the retry flag of a failed result", () => {
    const failed = normalizePracticeItemResult({
      ...scored, state: "FAILED", score: null, failureCode: "PROVIDER_ERROR", retryable: true,
    });
    expect(failed).toMatchObject({ state: "FAILED", score: null, failureCode: "PROVIDER_ERROR", retryable: true });
  });

  it("rejects a result with an unknown state or without an item id", () => {
    expect(normalizePracticeItemResult({ ...scored, state: "WHATEVER" })).toBeNull();
    expect(normalizePracticeItemResult({ ...scored, itemPublicId: undefined })).toBeNull();
    expect(normalizePracticeItemResult(null)).toBeNull();
  });

  it("only treats a finite score as a score", () => {
    expect(normalizePracticeItemResult({ ...scored, score: "78" })?.score).toBeNull();
  });
});

describe("session response with an item result", () => {
  const base = { publicId: "session-1", status: "COMPLETED" };

  it("exposes the result of the answered item", () => {
    expect(normalizePracticeSessionResponse({ ...base, itemResult: scored })?.itemResult?.score).toBe(78);
  });

  it("defaults to no result", () => {
    expect(normalizePracticeSessionResponse(base)?.itemResult).toBeNull();
  });

  it("keeps the presigned prompt media urls", () => {
    const session = normalizePracticeSessionResponse({
      publicId: "session-1",
      status: "IN_PROGRESS",
      currentTask: {
        publicId: "item-1", orderIndex: 0, taskCode: "REPEAT_SENTENCE", status: "PENDING",
        content: { audioPromptRef: "a1", audioUrl: "https://cdn.test/a.mp3", imageUrl: "https://cdn.test/i.png", options: [] },
      },
    });
    expect(session?.currentTask?.content).toMatchObject({
      audioUrl: "https://cdn.test/a.mp3",
      imageUrl: "https://cdn.test/i.png",
    });
  });
});
