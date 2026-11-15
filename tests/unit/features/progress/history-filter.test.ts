import { describe, expect, it } from "vitest";
import type { PracticeProgressEntry } from "@/features/practice/contracts";
import { historyFilterCounts, matchesHistoryFilter } from "@/features/progress/history-filter";

const entry = (overrides: Partial<PracticeProgressEntry> = {}): PracticeProgressEntry => ({
  sessionPublicId: "s", productCode: "PTE_CORE", title: "Read Aloud", status: "COMPLETED_PENDING_SCORE",
  sessionStatus: "COMPLETED", startedAt: null, lastActivityAt: null, completedAt: null, answeredItemCount: 6,
  draftItemCount: 0, skippedItemCount: 0, totalItemCount: 6, lowConfidenceCount: 0, mediumConfidenceCount: 0,
  highConfidenceCount: 0, unscoredAiCount: 0, scoringCount: 0, scoringFailedCount: 0,
  score: null, kind: "TASK", skillCode: "SPEAKING", taskCode: "READ_ALOUD", ...overrides,
});

describe("history filter", () => {
  const live = entry({ status: "IN_PROGRESS", sessionStatus: "IN_PROGRESS" });
  const unscored = entry({ unscoredAiCount: 6 });
  const failed = entry({ scoringFailedCount: 1 });
  const scoring = entry({ scoringCount: 2 });

  it("splits in-progress and completed sessions", () => {
    expect(matchesHistoryFilter(live, "IN_PROGRESS")).toBe(true);
    expect(matchesHistoryFilter(live, "COMPLETED")).toBe(false);
    expect(matchesHistoryFilter(unscored, "COMPLETED")).toBe(true);
  });

  it("awaits scoring only for unscored or failed answers, not while the AI is scoring", () => {
    expect(matchesHistoryFilter(unscored, "AWAITING_SCORE")).toBe(true);
    expect(matchesHistoryFilter(failed, "AWAITING_SCORE")).toBe(true);
    expect(matchesHistoryFilter(scoring, "AWAITING_SCORE")).toBe(false);
  });

  it("counts every filter", () => {
    expect(historyFilterCounts([live, unscored, failed, scoring]))
      .toEqual({ ALL: 4, IN_PROGRESS: 1, COMPLETED: 3, AWAITING_SCORE: 2 });
  });
});
