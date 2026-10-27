import { describe, expect, it } from "vitest";
import { buildRecommendations } from "./recommendations";

const t = (key: string) => ({
  "presentation.inProgress": "Đang làm dở · {done}/{total} câu",
  "presentation.mockDescription": "Đề đầy đủ",
  "presentation.questions": "câu",
  "presentation.skillPractice": "Luyện {skill}",
  "skills.reading": "Đọc",
} as Record<string, string>)[key] ?? key;
const taskName = (code: string) => code;

const entry = (id: string, status: string, kind: string | null) => ({
  sessionPublicId: id, status, kind, skillCode: "READING", taskCode: null, title: "T",
  answeredItemCount: 4, totalItemCount: 10,
}) as never;
const mock = (n: number, status?: string) => ({
  publicId: `m${n}`, title: `Mock ${n}`, sequenceNo: n, itemCount: 65, estimatedMinutes: 135,
  latestAttempt: status ? { sessionPublicId: `s${n}`, status, answeredItemCount: 23, totalItemCount: 65, estimatedOverall: null } : null,
}) as never;

describe("buildRecommendations", () => {
  it("puts unfinished practice first, then unfinished mock tests, then new ones", () => {
    const cards = buildRecommendations([mock(2), mock(1, "IN_PROGRESS")], [entry("a", "IN_PROGRESS", "SKILL")], taskName, t);

    expect(cards.map((card) => card.id)).toEqual(["session:a", "mock:m1", "mock:m2"]);
    expect(cards[0]).toMatchObject({ title: "Luyện Đọc · 10 câu", description: "Đang làm dở · 4/10 câu",
      minutes: null, action: "continue" });
    expect(cards[1]).toMatchObject({ action: "continue", progress: { done: 23, total: 65 } });
    expect(cards[2]).toMatchObject({ action: "start", minutes: 135, target: { type: "mock", publicId: "m2" } });
  });

  it("leaves out finished sessions and caps the list at six", () => {
    const mocks = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => mock(n));
    const cards = buildRecommendations(mocks, [entry("done", "COMPLETED_SCORED", "TASK")], taskName, t);
    expect(cards).toHaveLength(6);
    expect(cards.some((card) => card.id === "session:done")).toBe(false);
  });
});
