import { describe, expect, it } from "vitest";
import { fillFraction, progressDash, RING_PRESETS, ringGeometry, segmentDashes } from "@/common/components/ring-geometry";

describe("ringGeometry", () => {
  it("fits the stroke inside the box", () => {
    const { center, radius, circumference } = ringGeometry(90, 10);
    expect(center).toBe(45);
    expect(radius).toBe(40);
    expect(circumference).toBeCloseTo(2 * Math.PI * 40, 6);
  });

  it("never returns a negative radius", () => {
    expect(ringGeometry(8, 20).radius).toBe(0);
  });

  it("keeps the four reference presets", () => {
    expect(Object.values(RING_PRESETS).map((preset) => preset.size)).toEqual([90, 56, 48, 40]);
  });
});

describe("fillFraction", () => {
  it("clamps to 0..1", () => {
    expect(fillFraction(-3, 10)).toBe(0);
    expect(fillFraction(5, 10)).toBe(0.5);
    expect(fillFraction(25, 10)).toBe(1);
  });

  it("reads an empty or invalid range as zero", () => {
    expect(fillFraction(5, 0)).toBe(0);
    expect(fillFraction(Number.NaN, 10)).toBe(0);
    expect(fillFraction(5, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("progressDash", () => {
  it("splits the circumference into drawn and empty parts", () => {
    expect(progressDash(0.25, 200)).toBe("50 150");
    expect(progressDash(0, 200)).toBe("0 200");
    expect(progressDash(1, 200)).toBe("200 0");
  });

  it("clamps a fraction outside 0..1", () => {
    expect(progressDash(2, 200)).toBe("200 0");
    expect(progressDash(-1, 200)).toBe("0 200");
  });
});

describe("segmentDashes", () => {
  it("draws four evenly rotated segments by default", () => {
    const segments = segmentDashes(100, 5);
    expect(segments).toHaveLength(4);
    const step = segments[1].rotation - segments[0].rotation;
    expect(step).toBeCloseTo(90, 6);
  });

  it("leaves a visible gap between segments", () => {
    const [first] = segmentDashes(100, 5);
    const drawn = Number(first.dasharray.split(" ")[0]);
    expect(drawn).toBeLessThan(100 / 4);
    expect(drawn).toBeGreaterThan(0);
  });

  it("falls back to one segment for a nonsense count", () => {
    expect(segmentDashes(100, 5, 0)).toHaveLength(1);
  });
});
