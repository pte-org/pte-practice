import { describe, expect, it } from "vitest";
import type { PracticeProgressEntry } from "@/features/practice/contracts";
import { latestActiveTaskSession } from "@/features/practice/task-session";

const entry = (overrides: Partial<PracticeProgressEntry> = {}): PracticeProgressEntry => ({
  sessionPublicId: "live", productCode: "PTE_CORE", title: "Read Aloud", status: "IN_PROGRESS",
  sessionStatus: "IN_PROGRESS", startedAt: "2026-11-07T01:00:00Z", lastActivityAt: null,
  completedAt: null, answeredItemCount: 0, draftItemCount: 0, skippedItemCount: 0,
  totalItemCount: 10, lowConfidenceCount: 0, mediumConfidenceCount: 0, highConfidenceCount: 0, unscoredAiCount: 0, scoringCount: 0, scoringFailedCount: 0,
  score: null, kind: "TASK", skillCode: "SPEAKING", taskCode: "READ_ALOUD", ...overrides,
});

describe("latestActiveTaskSession", () => {
  it("does not let an undated or invalid legacy entry hide a recent session", () => {
    const entries = [entry({ startedAt: null }), entry({ startedAt: "invalid" }), entry({ sessionPublicId: "recent", lastActivityAt: "2026-11-07T02:00:00Z" })];
    expect(latestActiveTaskSession(entries, "READ_ALOUD")?.sessionPublicId).toBe("recent");
  });
  it("excludes expired sessions even when their progress is still in progress", () => {
    expect(latestActiveTaskSession([entry({ sessionStatus: "EXPIRED" })], "READ_ALOUD")).toBeUndefined();
  });
  it("selects the most recently used live session for the requested task without changing the input", () => {
    const entries = [entry(), entry({ sessionPublicId: "recent", lastActivityAt: "2026-11-07T02:00:00Z" }), entry({ taskCode: "WRITE_ESSAY" })];
    expect(latestActiveTaskSession(entries, "READ_ALOUD")?.sessionPublicId).toBe("recent");
    expect(entries[0].sessionPublicId).toBe("live");
  });
});
