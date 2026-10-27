import type { ReactElement } from "react";

/**
 * New (no @pte/ui equivalent): a progress bar split into parts, one segment per part; finished parts are full,
 * the current part is full too, later parts are faint. Props follow the @pte/ui style (`label` for accessibility).
 */
export interface SegmentedProgressProps {
  segments: ReadonlyArray<{ done: boolean; current: boolean }>;
  label: string;
}

export function SegmentedProgress({ segments, label }: SegmentedProgressProps): ReactElement {
  const reached = segments.filter((segment) => segment.done || segment.current).length;
  return (
    <div className="segmented-progress" role="progressbar" aria-label={label}
      aria-valuemin={0} aria-valuemax={segments.length} aria-valuenow={reached}>
      {segments.map((segment, index) => (
        <span key={index} className={`segmented-progress-part${segment.done || segment.current ? " segmented-progress-reached" : ""}`} />
      ))}
    </div>
  );
}
