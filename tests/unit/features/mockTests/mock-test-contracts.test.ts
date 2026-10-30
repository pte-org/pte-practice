import { describe, expect, it } from "vitest";
import { normalizeEstimatedScores, normalizeMockTests } from "@/features/mockTests/mock-test-contracts";

describe("normalizeMockTests", () => {
  it("reads a test with and without an attempt", () => {
    const tests = normalizeMockTests([
      { publicId: "a", title: "Mock 1", sequenceNo: 1, itemCount: 65, estimatedMinutes: 135, latestAttempt: null },
      { publicId: "b", title: "Mock 2", sequenceNo: 2, itemCount: 65, estimatedMinutes: 135,
        latestAttempt: { sessionPublicId: "s", status: "IN_PROGRESS", answeredItemCount: 5, totalItemCount: 65 } },
    ]);
    expect(tests).toHaveLength(2);
    expect(tests[0].latestAttempt).toBeNull();
    expect(tests[1].latestAttempt).toEqual({ sessionPublicId: "s", status: "IN_PROGRESS", answeredItemCount: 5,
      totalItemCount: 65, estimatedOverall: null });
  });

  it("drops malformed entries and attempts instead of failing", () => {
    expect(normalizeMockTests("nope")).toEqual([]);
    const tests = normalizeMockTests([null, { title: "no id" },
      { publicId: "c", sequenceNo: 3, latestAttempt: { sessionPublicId: "s", status: "DISCARDED" } }]);
    expect(tests).toHaveLength(1);
    expect(tests[0].title).toBe("PTE Academic Full Mock Test 3");
    expect(tests[0].latestAttempt).toBeNull();
  });
});

describe("normalizeEstimatedScores", () => {
  it("is null when the server sent none, and keeps missing skills null", () => {
    expect(normalizeEstimatedScores(null)).toBeNull();
    const scores = normalizeEstimatedScores({ overall: 62, speaking: 70, reading: null, pending: true, skippedItemCount: 3 });
    expect(scores).toMatchObject({ overall: 62, speaking: 70, writing: null, reading: null, pending: true,
      skippedItemCount: 3, excludedItemCount: 0 });
  });
});
