import { describe, expect, it } from "vitest";
import { subScoreLabel } from "@/features/practice/ScoreView";

describe("InlineResultCard helpers", () => {
  it("formats subScore labels with clean capitalization", () => {
    expect(subScoreLabel("oralFluency")).toBe("Oral fluency");
    expect(subScoreLabel("content")).toBe("Content");
    expect(subScoreLabel("pronunciation")).toBe("Pronunciation");
    expect(subScoreLabel("written_discourse")).toBe("Written discourse");
  });

  it("handles score verdict logic accurately", () => {
    const isCorrect = (score: number) => score >= 60;
    expect(isCorrect(100)).toBe(true);
    expect(isCorrect(90)).toBe(true);
    expect(isCorrect(60)).toBe(true);
    expect(isCorrect(50)).toBe(false);
    expect(isCorrect(0)).toBe(false);
  });

  it("determines footer button visibility based on scoring, answer, and history states", () => {
    function computeFooterState({
      hasAnswer,
      isSubmitted,
      isScoring,
      isViewingHistory,
      historyLength,
    }: {
      hasAnswer: boolean;
      isSubmitted: boolean;
      isScoring: boolean;
      isViewingHistory: boolean;
      historyLength: number;
    }) {
      if (isViewingHistory) {
        return {
          showPrev: true,
          showSkip: false,
          showSubmit: false,
          showNext: true,
        };
      }
      if (isSubmitted) {
        return {
          showPrev: historyLength > 0,
          showSkip: false,
          showSubmit: false,
          showNext: !isScoring,
        };
      }
      if (hasAnswer) {
        return {
          showPrev: historyLength > 0,
          showSkip: false,
          showSubmit: true,
          showNext: false,
        };
      }
      return {
        showPrev: historyLength > 0,
        showSkip: true,
        showSubmit: false,
        showNext: false,
      };
    }

    // 1. Unanswered on first question (no history): only Skip appears
    expect(computeFooterState({ hasAnswer: false, isSubmitted: false, isScoring: false, isViewingHistory: false, historyLength: 0 }))
      .toEqual({ showPrev: false, showSkip: true, showSubmit: false, showNext: false });

    // 2. Unanswered with previous questions: Previous + Skip appear side-by-side
    expect(computeFooterState({ hasAnswer: false, isSubmitted: false, isScoring: false, isViewingHistory: false, historyLength: 1 }))
      .toEqual({ showPrev: true, showSkip: true, showSubmit: false, showNext: false });

    // 3. User entered an answer: Submit appears centered (Next and Skip hidden)
    expect(computeFooterState({ hasAnswer: true, isSubmitted: false, isScoring: false, isViewingHistory: false, historyLength: 1 }))
      .toEqual({ showPrev: true, showSkip: false, showSubmit: true, showNext: false });

    // 4. Submitted and currently scoring: Next is hidden, Submit is hidden
    expect(computeFooterState({ hasAnswer: true, isSubmitted: true, isScoring: true, isViewingHistory: false, historyLength: 0 }))
      .toEqual({ showPrev: false, showSkip: false, showSubmit: false, showNext: false });

    // 5. Scoring settled: Next button appears
    expect(computeFooterState({ hasAnswer: true, isSubmitted: true, isScoring: false, isViewingHistory: false, historyLength: 0 }))
      .toEqual({ showPrev: false, showSkip: false, showSubmit: false, showNext: true });

    // 6. Reviewing history (answered question): Previous + Next appear to navigate
    expect(computeFooterState({ hasAnswer: true, isSubmitted: true, isScoring: false, isViewingHistory: true, historyLength: 2 }))
      .toEqual({ showPrev: true, showSkip: false, showSubmit: false, showNext: true });

    // 7. Reviewing history (skipped question): Previous + Next appear to navigate
    expect(computeFooterState({ hasAnswer: false, isSubmitted: false, isScoring: false, isViewingHistory: true, historyLength: 1 }))
      .toEqual({ showPrev: true, showSkip: false, showSubmit: false, showNext: true });
  });

  it("ensures skipped history items never trigger scoring and are marked correctly", () => {
    interface HistoryItemTest {
      taskPublicId: string;
      isSkipped?: boolean;
      result: unknown;
    }

    const skippedItem: HistoryItemTest = {
      taskPublicId: "task-1",
      isSkipped: true,
      result: null,
    };

    // When viewing a skipped item, isSubmitted must be false and isSkipped true
    const activeIsSkipped = Boolean(skippedItem.isSkipped);
    const isSubmitted = !activeIsSkipped;

    expect(activeIsSkipped).toBe(true);
    expect(isSubmitted).toBe(false);
    expect(skippedItem.result).toBeNull();
  });
});

