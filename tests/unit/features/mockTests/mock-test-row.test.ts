import { describe, expect, it } from "vitest";
import { formatEstimatedDuration, mockTestAction } from "@/features/mockTests/mock-test-row";

const test = (status?: string) => ({
  latestAttempt: status ? { status } : null,
}) as never;

describe("mockTestAction", () => {
  it("starts when there is no attempt, continues an unfinished one and retakes a finished one", () => {
    expect(mockTestAction(test())).toBe("START");
    expect(mockTestAction(test("OVERVIEW"))).toBe("CONTINUE");
    expect(mockTestAction(test("IN_PROGRESS"))).toBe("CONTINUE");
    expect(mockTestAction(test("COMPLETED"))).toBe("RETAKE");
    expect(mockTestAction(test("EXPIRED"))).toBe("START");
  });
});

describe("formatEstimatedDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatEstimatedDuration(135)).toBe("2h 15m");
    expect(formatEstimatedDuration(120)).toBe("2h");
    expect(formatEstimatedDuration(45)).toBe("45m");
    expect(formatEstimatedDuration(0)).toBe("0m");
  });
});
