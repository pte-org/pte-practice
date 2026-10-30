import { describe, expect, it } from "vitest";
import { progressMetrics } from "@/features/progress/progress-summary";

const progress = (scores: (number | null)[]) => ({
  entries: scores.map((score) => ({ score })), totalSessions: scores.length, completedSessions: 2, answeredItems: 9,
  totalItems: 12, generatedAt: null, hasMore: false,
}) as never;

describe("progressMetrics", () => {
  it("averages the sessions that have a score", () => {
    expect(progressMetrics(progress([80, null, 60]))).toEqual({ sessions: 3, completed: 2, answered: 9, averageScore: 70 });
  });

  it("has no average without scored sessions", () => {
    expect(progressMetrics(progress([])).averageScore).toBeNull();
    expect(progressMetrics(progress([null])).averageScore).toBeNull();
  });
});
