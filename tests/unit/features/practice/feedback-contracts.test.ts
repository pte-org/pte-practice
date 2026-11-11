import { describe, expect, it } from "vitest";
import { normalizeAnswerFeedback } from "@/features/practice/feedback-contracts";
import { normalizePracticeItemResult } from "@/features/practice/session-contracts";
import { scoringCounts } from "@/features/practice/useMockTestScoring";
import type { PracticeReview } from "@/features/practice/contracts";

describe("answer feedback contract", () => {
  it("keeps reasons, tips and known word marks only", () => {
    expect(normalizeAnswerFeedback({
      traitReasons: { CONTENT: "Đủ ý.", ORAL_FLUENCY: " ", GRAMMAR: 3 },
      tips: ["Nói chậm lại.", "", 4],
      wordMarks: [{ word: "of", mark: "OMITTED" }, { word: "x", mark: "SUBSTITUTED" }, { mark: "INSERTED" }],
    })).toEqual({ traitReasons: { CONTENT: "Đủ ý." }, tips: ["Nói chậm lại."], wordMarks: [{ word: "of", mark: "OMITTED" }] });
  });

  it("is absent when the scorer wrote nothing", () => {
    expect(normalizeAnswerFeedback(null)).toBeNull();
    expect(normalizeAnswerFeedback({ traitReasons: {}, tips: [], wordMarks: [] })).toBeNull();
    const result = normalizePracticeItemResult({ itemPublicId: "i", state: "SCORED", feedbackDetail: null });
    expect(result).not.toBeNull();
    expect(result && "feedbackDetail" in result).toBe(false);
  });

  it("counts a mock test's unscored and scoring answers", () => {
    const item = (state: "NONE" | "SCORING" | "SCORED" | null) => ({
      publicId: `${state}`, orderIndex: 0, taskCode: "READ_ALOUD", displayName: "Read Aloud", section: "SPEAKING",
      status: "ANSWERED" as const, promptText: null, savedPayload: null, rendererKey: null, options: [], score: null,
      result: state ? normalizePracticeItemResult({ itemPublicId: "i", state }) : null, cefrLevel: null,
    });
    const review: PracticeReview = { sessionPublicId: "s", estimatedScores: null, kind: "MOCK_TEST",
      items: [item("NONE"), item("NONE"), item("SCORING"), item("SCORED"), item(null)] };
    expect(scoringCounts(review)).toEqual({ unscored: 2, scoring: 1 });
  });
});
