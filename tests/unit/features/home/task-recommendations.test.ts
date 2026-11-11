import { describe, expect, it } from "vitest";
import type { PracticeProgressEntry } from "@/features/practice/contracts";
import { buildTaskRecommendations } from "@/features/home/recommendations";

const entry = (id: string, taskCode: string | null, changes: Partial<PracticeProgressEntry> = {}): PracticeProgressEntry => ({
  sessionPublicId: id, productCode: "PTE_CORE", title: "Practice", status: "IN_PROGRESS",
  sessionStatus: "IN_PROGRESS", startedAt: "2026-11-07T01:00:00Z", completedAt: null,
  lastActivityAt: "2026-11-07T02:00:00Z", answeredItemCount: 2, draftItemCount: 0,
  skippedItemCount: 0, totalItemCount: 10, lowConfidenceCount: 0, mediumConfidenceCount: 0,
  highConfidenceCount: 0, unscoredAiCount: 0, scoringCount: 0, scoringFailedCount: 0, score: null, kind: "TASK", skillCode: "SPEAKING", taskCode, ...changes,
});
const build = (entries: PracticeProgressEntry[]) => buildTaskRecommendations(entries, (code) => `Task ${code}`, (key) => key);

describe("task-type resume recommendations", () => {
  it("shows one latest session per task without combining progress or changing input order", () => {
    const entries = [entry("old", "READ_ALOUD"), entry("writing", "WRITE_ESSAY"),
      entry("new", "READ_ALOUD", { lastActivityAt: "2026-11-07T03:00:00Z", answeredItemCount: 5 })];
    const cards = build(entries);
    expect(cards.map((card) => card.taskCode)).toEqual(["READ_ALOUD", "WRITE_ESSAY"]);
    expect(cards[0]).toMatchObject({ title: "Task READ_ALOUD", progress: { done: 5, total: 10 },
      target: { type: "href", href: "/practice-tests/session?sessionId=new" } });
    expect(entries[0].sessionPublicId).toBe("old");
  });

  it("excludes mixed-skill sessions, mock tests and completed tasks", () => {
    expect(build([entry("skill-a", null, { kind: "SKILL" }), entry("skill-b", null, { kind: "SKILL" }),
      entry("mock", "READ_ALOUD", { kind: "MOCK_TEST" }),
      entry("done", "READ_ALOUD", { status: "COMPLETED_SCORED" })])).toEqual([]);
  });

  it("uses start time if activity time is absent and tolerates undated legacy entries", () => {
    const cards = build([entry("undated", "READ_ALOUD", { startedAt: null, lastActivityAt: null }),
      entry("started", "READ_ALOUD", { lastActivityAt: null })]);
    expect(cards[0].id).toBe("session:started");
  });

  it("keeps a resumable session when a newer expired session has saved responses", () => {
    const cards = build([entry("live", "READ_ALOUD"), entry("expired", "READ_ALOUD", {
      sessionStatus: "EXPIRED", lastActivityAt: "2026-11-07T04:00:00Z",
    })]);
    expect(cards.map((card) => card.id)).toEqual(["session:live"]);
  });
});
