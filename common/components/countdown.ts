/**
 * Countdown maths for timed practice. Time is always derived from a wall-clock deadline rather than decremented
 * per tick, so a throttled background tab cannot make the timer drift.
 */

/** Whole seconds left, rounded up so the display reaches 0 only once the deadline has passed. */
export function remainingSeconds(deadlineMs: number, nowMs: number): number {
  return Math.max(Math.ceil((deadlineMs - nowMs) / 1000), 0);
}

/** `m:ss` clock text, e.g. 75 → `1:15`. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(Math.floor(totalSeconds), 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Fraction of the phase still remaining (1 at the start, 0 at the deadline). */
export function fractionRemaining(deadlineMs: number, totalSeconds: number, nowMs: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(Math.max((deadlineMs - nowMs) / (totalSeconds * 1000), 0), 1);
}

export function hasElapsed(deadlineMs: number, nowMs: number): boolean {
  return nowMs >= deadlineMs;
}
