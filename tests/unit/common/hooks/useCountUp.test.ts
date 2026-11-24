import { describe, expect, it } from "vitest";
import { countUpValue } from "@/common/hooks/useCountUp";

describe("countUpValue", () => {
  it("starts at where it stands and ends on the target", () => {
    expect(countUpValue(0, 80, 0, 1000)).toBe(0);
    expect(countUpValue(0, 80, 1000, 1000)).toBe(80);
    expect(countUpValue(0, 80, 5000, 1000)).toBe(80);
  });

  it("eases out: more than half way at half the time, and never past the target", () => {
    const half = countUpValue(0, 100, 500, 1000);
    expect(half).toBeGreaterThan(50);
    expect(half).toBeLessThan(100);
  });

  it("only ever moves towards the target, up or down", () => {
    const up = [100, 300, 600, 900].map((elapsed) => countUpValue(10, 90, elapsed, 1000));
    expect([...up].sort((left, right) => left - right)).toEqual(up);
    const down = [100, 300, 600, 900].map((elapsed) => countUpValue(90, 10, elapsed, 1000));
    expect([...down].sort((left, right) => right - left)).toEqual(down);
  });

  it("is already there when there is no duration (reduced motion)", () => {
    expect(countUpValue(0, 60, 0, 0)).toBe(60);
  });

  it("does not run backwards before it has started", () => {
    expect(countUpValue(0, 60, -50, 1000)).toBe(0);
  });
});
