/**
 * Geometry of the score gauge: a three-quarter arc that opens at the bottom, a filled part of it up to the score, and
 * a knob at the end of the filled part. Angles are degrees clockwise from twelve o'clock. Pure functions, so they can
 * be tested without a DOM.
 */
export const GAUGE_START_DEGREES = -135;
export const GAUGE_SWEEP_DEGREES = 270;
/** Room between the arc and the edge of the box for the knob and its shadow. */
const EDGE_MARGIN = 12;
const PLATE_MARGIN = 10;
/** An arc shorter than this is not drawn: it would only be a dot at the start. */
const MIN_FILL_DEGREES = 0.5;

export interface GaugePoint {
  x: number;
  y: number;
}

export interface GaugeLayout {
  center: number;
  radius: number;
  /** Radius of the round plate in the middle, which holds the score. */
  plateRadius: number;
  /** Radius of the faint decorative ring around everything. */
  ringRadius: number;
  /** The whole arc, as an SVG path. */
  track: string;
  /** The part of it the score reaches; null at (nearly) zero. */
  fill: string | null;
  knob: GaugePoint;
}

export interface GaugeOptions {
  size: number;
  thickness: number;
  value: number;
  max: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

function fractionOf(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}

/** The angle of a point of the gauge, `fraction` (0..1) of the way along its arc. */
export function gaugeAngle(fraction: number): number {
  return GAUGE_START_DEGREES + GAUGE_SWEEP_DEGREES * Math.min(Math.max(fraction, 0), 1);
}

export function polarPoint(center: number, radius: number, degrees: number): GaugePoint {
  const radians = (degrees * Math.PI) / 180;
  return { x: round(center + radius * Math.sin(radians)), y: round(center - radius * Math.cos(radians)) };
}

/** A clockwise arc of the circle around `center`; the large-arc flag follows its span. */
export function arcPath(center: number, radius: number, fromDegrees: number, toDegrees: number): string {
  const from = polarPoint(center, radius, fromDegrees);
  const to = polarPoint(center, radius, toDegrees);
  const largeArc = toDegrees - fromDegrees > 180 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y}`;
}

export function gaugeLayout({ size, thickness, value, max }: GaugeOptions): GaugeLayout {
  const center = size / 2;
  const radius = Math.max(center - thickness / 2 - EDGE_MARGIN, 1);
  const valueDegrees = gaugeAngle(fractionOf(value, max));
  const end = GAUGE_START_DEGREES + GAUGE_SWEEP_DEGREES;

  return {
    center,
    radius,
    plateRadius: Math.max(radius - thickness / 2 - PLATE_MARGIN, 1),
    ringRadius: center - 3,
    track: arcPath(center, radius, GAUGE_START_DEGREES, end),
    fill: valueDegrees - GAUGE_START_DEGREES >= MIN_FILL_DEGREES
      ? arcPath(center, radius, GAUGE_START_DEGREES, valueDegrees) : null,
    knob: polarPoint(center, radius, valueDegrees),
  };
}
