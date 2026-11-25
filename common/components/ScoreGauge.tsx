import type { ReactElement, ReactNode } from "react";
import { gaugeLayout } from "./score-gauge-geometry";
import "./score-gauge.css";

export type ScoreGaugeTone = "low" | "mid" | "high";

export interface ScoreGaugeProps {
  /** Accessible name; the gauge is never decorative because its value carries meaning. */
  label: string;
  /** The score. Screen readers always get this, even while the picture is still running up to it. */
  value: number;
  max?: number;
  /** What is drawn when it differs from `value`: pass a number that runs up to it to animate the gauge. */
  drawnValue?: number;
  /** Scores below `low` are tinted as low, scores from `high` up as high, the rest as medium. */
  limits: { low: number; high: number };
  size?: number;
  thickness?: number;
  /** Shown on the plate in the middle (the score and what it is out of). */
  children?: ReactNode;
}

const DEFAULT_SIZE = 260;
const DEFAULT_THICKNESS = 22;
const KNOB_EXTRA_RADIUS = 3;
const KNOB_STROKE = 4;

function toneOf(value: number, limits: { low: number; high: number }): ScoreGaugeTone {
  return value < limits.low ? "low" : value < limits.high ? "mid" : "high";
}

/**
 * Three-quarter gauge for a score: a track, the part the score reaches filled in the tone of that score, and a knob
 * at its end. Colours come from theme tokens through the `score-gauge-*` classes and every dimension is an SVG
 * attribute, so there is no inline style and it follows the light and dark themes.
 */
export function ScoreGauge({
  label, value, max = 100, drawnValue, limits, size = DEFAULT_SIZE, thickness = DEFAULT_THICKNESS, children,
}: ScoreGaugeProps): ReactElement {
  const drawn = drawnValue ?? value;
  const layout = gaugeLayout({ size, thickness, value: drawn, max });
  const shown = Math.min(Math.max(value, 0), max);

  return (
    <span className={`score-gauge score-gauge-tone-${toneOf(drawn, limits)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="meter" aria-label={label}
        aria-valuemin={0} aria-valuemax={max} aria-valuenow={shown}>
        <circle className="score-gauge-ring" cx={layout.center} cy={layout.center} r={layout.ringRadius} fill="none" />
        <path className="score-gauge-track" d={layout.track} fill="none" strokeWidth={thickness} strokeLinecap="round" />
        {layout.fill ? (
          <path className="score-gauge-fill" d={layout.fill} fill="none" strokeWidth={thickness} strokeLinecap="round" />
        ) : null}
        <circle className="score-gauge-plate" cx={layout.center} cy={layout.center} r={layout.plateRadius} />
        <circle className="score-gauge-knob" cx={layout.knob.x} cy={layout.knob.y}
          r={thickness / 2 + KNOB_EXTRA_RADIUS} strokeWidth={KNOB_STROKE} />
      </svg>
      {children ? <span className="score-gauge-content">{children}</span> : null}
    </span>
  );
}
