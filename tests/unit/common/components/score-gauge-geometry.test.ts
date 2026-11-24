import { describe, expect, it } from "vitest";
import { arcPath, gaugeAngle, gaugeLayout, polarPoint } from "@/common/components/score-gauge-geometry";

const options = { size: 260, thickness: 22, max: 100 };

describe("gauge angles", () => {
  it("opens at the bottom: the arc runs from -135 to 135 degrees", () => {
    expect(gaugeAngle(0)).toBe(-135);
    expect(gaugeAngle(0.5)).toBe(0);
    expect(gaugeAngle(1)).toBe(135);
  });

  it("clamps a fraction outside 0..1", () => {
    expect(gaugeAngle(-2)).toBe(-135);
    expect(gaugeAngle(9)).toBe(135);
  });

  it("places points clockwise from twelve o'clock", () => {
    expect(polarPoint(100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(polarPoint(100, 50, 90)).toEqual({ x: 150, y: 100 });
    expect(polarPoint(100, 50, 180)).toEqual({ x: 100, y: 150 });
  });

  it("draws a clockwise arc and flags a span of more than half a turn", () => {
    expect(arcPath(100, 50, 0, 90)).toBe("M 100 50 A 50 50 0 0 1 150 100");
    expect(arcPath(100, 50, -135, 135)).toContain("A 50 50 0 1 1");
  });
});

describe("gauge layout", () => {
  it("draws the whole arc as the track and nothing filled at zero", () => {
    const layout = gaugeLayout({ ...options, value: 0 });
    expect(layout.track.startsWith("M ")).toBe(true);
    expect(layout.fill).toBeNull();
  });

  it("fills from the start of the arc up to the score", () => {
    const layout = gaugeLayout({ ...options, value: 50 });
    expect(layout.fill?.startsWith(layout.track.slice(0, layout.track.indexOf("A")))).toBe(true);
    expect(layout.fill).not.toBe(layout.track);
  });

  it("fills the whole arc for a full score", () => {
    const layout = gaugeLayout({ ...options, value: 100 });
    expect(layout.fill).toBe(layout.track);
  });

  it("puts the knob at the end of the filled part, and at the start for none", () => {
    const full = gaugeLayout({ ...options, value: 100 });
    expect(full.knob).toEqual(polarPoint(full.center, full.radius, 135));
    const none = gaugeLayout({ ...options, value: 0 });
    expect(none.knob).toEqual(polarPoint(none.center, none.radius, -135));
    const half = gaugeLayout({ ...options, value: 50 });
    expect(half.knob).toEqual(polarPoint(half.center, half.radius, 0));
  });

  it("keeps the plate inside the arc and everything inside the box", () => {
    const layout = gaugeLayout({ ...options, value: 50 });
    expect(layout.plateRadius).toBeLessThan(layout.radius - options.thickness / 2);
    expect(layout.radius + options.thickness / 2 + 4).toBeLessThan(layout.center);
  });

  it("reads an unusable or out-of-range score as the nearest end", () => {
    expect(gaugeLayout({ ...options, value: Number.NaN }).fill).toBeNull();
    expect(gaugeLayout({ ...options, value: 500 }).fill).toBe(gaugeLayout({ ...options, value: 100 }).track);
  });
});
