import type { ReactElement, ReactNode } from "react";
import { fillFraction, progressDash, RING_PRESETS, ringGeometry, segmentDashes, type RingPreset } from "./ring-geometry";

export type ProgressRingVariant = "progress" | "segmented" | "empty";
export type ProgressRingTone = "accent" | "green" | "amber" | "red" | "muted";

export interface ProgressRingProps {
  /** Accessible name; the ring is never decorative because its value carries meaning. */
  label: string;
  value?: number;
  max?: number;
  /** A preset name (lg/md/sm/xs) or a pixel size. */
  size?: RingPreset | number;
  thickness?: number;
  /** `progress` draws value/max, `segmented` is the loading / no-data look, `empty` only the track. */
  variant?: ProgressRingVariant;
  tone?: ProgressRingTone;
  /** Shown in the middle of the ring (a number, a time, an icon). */
  children?: ReactNode;
}

const RING_START_ROTATION = -90;

/**
 * SVG progress ring. Colours come from theme tokens through the `progress-ring-*` classes and every dimension is an
 * SVG attribute, so there is no inline style and the ring follows the light and dark themes.
 */
export function ProgressRing({
  label,
  value = 0,
  max = 0,
  size = "md",
  thickness,
  variant = "progress",
  tone = "accent",
  children,
}: ProgressRingProps): ReactElement {
  const preset = typeof size === "number" ? null : RING_PRESETS[size];
  const pixels = typeof size === "number" ? size : preset?.size ?? RING_PRESETS.md.size;
  const stroke = thickness ?? preset?.thickness ?? Math.max(Math.round(pixels / 10), 3);
  const { center, radius, circumference } = ringGeometry(pixels, stroke);
  const fraction = fillFraction(value, max);
  const isProgress = variant === "progress";

  return (
    <span className={`ring-root progress-ring-tone-${tone}`}>
      <svg
        width={pixels}
        height={pixels}
        viewBox={`0 0 ${pixels} ${pixels}`}
        role={isProgress ? "progressbar" : "img"}
        aria-label={label}
        aria-valuemin={isProgress ? 0 : undefined}
        aria-valuemax={isProgress ? Math.max(max, 0) : undefined}
        aria-valuenow={isProgress ? Math.min(Math.max(value, 0), Math.max(max, 0)) : undefined}
      >
        {variant === "segmented" ? (
          segmentDashes(circumference, stroke).map((segment) => (
            <circle
              key={segment.rotation}
              className="progress-ring-segment"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={segment.dasharray}
              transform={`rotate(${segment.rotation} ${center} ${center})`}
            />
          ))
        ) : (
          <circle className="progress-ring-track" cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} />
        )}
        {isProgress && fraction > 0 ? (
          <circle
            className="progress-ring-bar"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={progressDash(fraction, circumference)}
            transform={`rotate(${RING_START_ROTATION} ${center} ${center})`}
          />
        ) : null}
      </svg>
      {children ? <span className="progress-ring-content">{children}</span> : null}
    </span>
  );
}
