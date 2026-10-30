/**
 * Geometry of the progress rings, rebuilt from the reference sizes (90/10, 56/6, 48/5 and 40/5 px, size/thickness)
 * as plain SVG circles. Pure functions so they can be tested without a DOM.
 */
export const RING_PRESETS = {
  lg: { size: 90, thickness: 10 },
  md: { size: 56, thickness: 6 },
  sm: { size: 48, thickness: 5 },
  xs: { size: 40, thickness: 5 },
} as const;

export type RingPreset = keyof typeof RING_PRESETS;

export interface RingGeometry {
  center: number;
  radius: number;
  circumference: number;
}

export function ringGeometry(size: number, thickness: number): RingGeometry {
  const radius = Math.max((size - thickness) / 2, 0);
  return { center: size / 2, radius, circumference: 2 * Math.PI * radius };
}

/** Fraction of the ring that is filled, clamped to 0..1; an empty or invalid range reads as 0. */
export function fillFraction(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}

/** `stroke-dasharray` that draws {@code fraction} of the circle and leaves the rest empty. */
export function progressDash(fraction: number, circumference: number): string {
  const filled = Math.min(Math.max(fraction, 0), 1) * circumference;
  return `${filled} ${Math.max(circumference - filled, 0)}`;
}

export interface SegmentDash {
  dasharray: string;
  /** Rotation in degrees around the ring centre. */
  rotation: number;
}

/**
 * Splits the ring into rounded segments separated by gaps (the loading / no-data look of the reference).
 * Round caps add half a stroke width at each end, so the gap is widened by one thickness to stay visible.
 */
export function segmentDashes(circumference: number, thickness: number, segments = 4, gapRatio = 0.35): SegmentDash[] {
  const count = Math.max(Math.floor(segments), 1);
  const slot = circumference / count;
  const gap = slot * Math.min(Math.max(gapRatio, 0), 0.9) + thickness;
  const dash = Math.max(slot - gap, 0.1);
  return Array.from({ length: count }, (_, index) => ({
    dasharray: `${dash} ${Math.max(circumference - dash, 0)}`,
    rotation: -90 + (360 / count) * index + (gap / circumference) * 180,
  }));
}
