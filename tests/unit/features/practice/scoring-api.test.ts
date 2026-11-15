import { describe, expect, it, vi } from "vitest";
import { scoringRequests } from "@/features/practice/scoring-api";

describe("scoring requests", () => {
  it("asks to score one answer and reads its new state", async () => {
    const request = vi.fn().mockResolvedValue({ itemPublicId: "item-1", state: "SCORING" });
    const api = scoringRequests(request, (code) => new Error(code));

    const result = await api.requestScoring("session-1", "item-1");

    expect(request).toHaveBeenCalledWith("/api/v1/student/practice/sessions/session-1/items/item-1/scoring",
      { method: "POST" });
    expect(result.state).toBe("SCORING");
  });

  it("rejects an unreadable answer state", async () => {
    const api = scoringRequests(vi.fn().mockResolvedValue({}), (code) => new Error(code));
    await expect(api.requestScoring("s", "i")).rejects.toThrow("INVALID_ITEM_RESULT");
  });

  it("scores a whole mock test and reports how many answers were queued", async () => {
    const request = vi.fn().mockResolvedValue({ queuedCount: 7, scoringCount: 8 });
    const api = scoringRequests(request, (code) => new Error(code));

    expect(await api.requestMockTestScoring("session-1")).toEqual({ queuedCount: 7, scoringCount: 8 });
    expect(request).toHaveBeenCalledWith("/api/v1/student/practice/sessions/session-1/scoring", { method: "POST" });
  });
});
