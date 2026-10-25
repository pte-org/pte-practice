/** Whether a written answer is outside the task's word range (it can still be submitted, after a warning). */
export function wordCountIssue(words: number, min: number | null, max: number | null): "under" | "over" | null {
  if (min !== null && words < min) return "under";
  if (max !== null && words > max) return "over";
  return null;
}

/** A recording that is under a second, or has no sound at all, is almost certainly a mistake. */
export const MIN_RECORDING_SECONDS = 1;
export const SILENT_LEVEL = 0.01;

export function recordingIssue(durationSeconds: number, maxLevel: number): "short" | "silent" | null {
  if (durationSeconds < MIN_RECORDING_SECONDS) return "short";
  if (maxLevel < SILENT_LEVEL) return "silent";
  return null;
}
