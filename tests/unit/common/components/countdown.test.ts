import { describe, expect, it } from "vitest";
import { formatClock, fractionRemaining, hasElapsed, remainingSeconds } from "@/common/components/countdown";

describe("remainingSeconds", () => {
  it("rounds up so 0 only shows after the deadline", () => {
    expect(remainingSeconds(10_000, 9_001)).toBe(1);
    expect(remainingSeconds(10_000, 9_999)).toBe(1);
    expect(remainingSeconds(10_000, 10_000)).toBe(0);
  });

  it("never goes negative after the deadline", () => {
    expect(remainingSeconds(10_000, 25_000)).toBe(0);
  });
});

describe("formatClock", () => {
  it("formats minutes and padded seconds", () => {
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(600)).toBe("10:00");
  });

  it("treats negative or fractional input safely", () => {
    expect(formatClock(-4)).toBe("0:00");
    expect(formatClock(59.9)).toBe("0:59");
  });
});

describe("fractionRemaining", () => {
  it("runs from 1 down to 0", () => {
    expect(fractionRemaining(40_000, 40, 0)).toBe(1);
    expect(fractionRemaining(40_000, 40, 20_000)).toBe(0.5);
    expect(fractionRemaining(40_000, 40, 40_000)).toBe(0);
  });

  it("clamps outside the phase and handles a zero-length phase", () => {
    expect(fractionRemaining(40_000, 40, -5_000)).toBe(1);
    expect(fractionRemaining(40_000, 40, 90_000)).toBe(0);
    expect(fractionRemaining(0, 0, 0)).toBe(0);
  });
});

describe("hasElapsed", () => {
  it("is true at and after the deadline", () => {
    expect(hasElapsed(1_000, 999)).toBe(false);
    expect(hasElapsed(1_000, 1_000)).toBe(true);
  });
});
