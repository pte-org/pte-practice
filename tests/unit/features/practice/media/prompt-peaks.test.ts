import { describe, expect, it } from "vitest";
import { fallbackPeaks, stableUrlKey } from "@/features/practice/media/prompt-peaks";

describe("fallbackPeaks", () => {
  it("draws the same shape for the same file and a different one for another", () => {
    const first = fallbackPeaks("https://cdn/a.mp3");
    expect(fallbackPeaks("https://cdn/a.mp3")).toEqual(first);
    expect(fallbackPeaks("https://cdn/b.mp3")).not.toEqual(first);
  });

  it("stays visible and within range", () => {
    const peaks = fallbackPeaks("seed", 40);
    expect(peaks).toHaveLength(40);
    expect(Math.min(...peaks)).toBeGreaterThanOrEqual(0.12);
    expect(Math.max(...peaks)).toBeLessThanOrEqual(1);
  });
});

describe("stableUrlKey", () => {
  it("drops the signature of a presigned link", () => {
    expect(stableUrlKey("https://cdn/a.mp3?sig=1&exp=2")).toBe("https://cdn/a.mp3");
  });
});
