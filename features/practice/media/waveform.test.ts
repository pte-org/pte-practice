import { describe, expect, it } from "vitest";
import {
  clampRecordingDuration, computePeaks, normalizePeaks, padLevels, playedBars, rmsLevel, seekFraction,
} from "./waveform";

describe("computePeaks", () => {
  it("takes the loudest sample of each slice", () => {
    const peaks = computePeaks([new Float32Array([0.125, -0.5, 0.25, 0.75])], 2);
    expect(peaks).toEqual([0.5, 0.75]);
  });

  it("spans chunk boundaries and returns zeros for no audio", () => {
    expect(computePeaks([new Float32Array([0.25]), new Float32Array([0.5])], 2)).toEqual([0.25, 0.5]);
    expect(computePeaks([], 4)).toEqual([0, 0, 0, 0]);
  });
});

describe("normalizePeaks", () => {
  it("scales the loudest bar to 1 and keeps silence at 0", () => {
    expect(normalizePeaks([0.25, 0.5])).toEqual([0.5, 1]);
    expect(normalizePeaks([0, 0])).toEqual([0, 0]);
  });
});

describe("rmsLevel", () => {
  it("is 0 for silence and the amplitude for a constant signal", () => {
    expect(rmsLevel(new Float32Array(4))).toBe(0);
    expect(rmsLevel(new Float32Array([0.5, 0.5, 0.5, 0.5]))).toBeCloseTo(0.5);
  });
});

describe("seekFraction and playedBars", () => {
  it("clamps the pointer position into the waveform", () => {
    expect(seekFraction(50, 200)).toBe(0.25);
    expect(seekFraction(-5, 200)).toBe(0);
    expect(seekFraction(300, 200)).toBe(1);
    expect(seekFraction(10, 0)).toBe(0);
  });

  it("counts the played bars", () => {
    expect(playedBars(0.5, 64)).toBe(32);
    expect(playedBars(2, 64)).toBe(64);
  });
});

describe("clampRecordingDuration", () => {
  it("stays within 1 second and the cap", () => {
    expect(clampRecordingDuration(0.2, 120)).toBe(1);
    expect(clampRecordingDuration(500, 120)).toBe(120);
    expect(clampRecordingDuration(12.4, 120)).toBe(12);
  });
});

describe("padLevels", () => {
  it("keeps the newest levels on the right of a fixed-size bar set", () => {
    expect(padLevels([0.5, 1], 4)).toEqual([0, 0, 0.5, 1]);
    expect(padLevels([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
    expect(padLevels([], 2)).toEqual([0, 0]);
  });
});
