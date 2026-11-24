"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 1200;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Where a count that eases out has got to `elapsedMs` into `durationMs`; a zero duration is already there. */
export function countUpValue(from: number, to: number, elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0 || elapsedMs >= durationMs) return to;
  const progress = Math.max(elapsedMs, 0) / durationMs;
  const eased = 1 - (1 - progress) ** 3;
  return from + (to - from) * eased;
}

/**
 * A number that runs up to `target` (from 0 the first time, from where it stands when the target changes) so a score
 * can be seen arriving. It reaches the target at once when the user asked for reduced motion. The first render, and the
 * server render, show 0.
 */
export function useCountUp(target: number, durationMs = DEFAULT_DURATION_MS): number {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    const from = shown.current;
    const duration = window.matchMedia(REDUCED_MOTION_QUERY).matches ? 0 : durationMs;
    const startedAt = performance.now();
    let frame = 0;
    const step = (now: number): void => {
      const next = countUpValue(from, target, now - startedAt, duration);
      shown.current = next;
      setValue(next);
      if (next !== target) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
