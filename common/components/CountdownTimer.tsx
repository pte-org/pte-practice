"use client";

import { type ReactElement, useEffect, useRef, useState } from "react";
import { formatClock, fractionRemaining, hasElapsed, remainingSeconds } from "./countdown";
import { ProgressRing, type ProgressRingTone } from "./ProgressRing";
import type { RingPreset } from "./ring-geometry";

const TICK_MS = 250;
const DEFAULT_WARN_BELOW_SECONDS = 10;

export interface CountdownTimerProps {
  /** Wall-clock deadline in epoch ms; null shows a stopped, full ring (nothing to count yet). */
  deadlineMs: number | null;
  totalSeconds: number;
  /** Accessible name, already translated (for example "Time left to answer"). */
  label: string;
  /** Visible text shown with the clock once time is nearly out, so the warning is not colour-only. */
  warningText?: string;
  size?: RingPreset | number;
  warnBelowSeconds?: number;
  /** Called exactly once, when the deadline passes. */
  onElapsed?: () => void;
}

/**
 * Countdown shown as a ring with the remaining time in the middle. Time is derived from {@code deadlineMs} on every
 * tick, never decremented, so the display stays correct after a throttled or backgrounded tab.
 */
export function CountdownTimer({
  deadlineMs,
  totalSeconds,
  label,
  warningText,
  size = "lg",
  warnBelowSeconds = DEFAULT_WARN_BELOW_SECONDS,
  onElapsed,
}: CountdownTimerProps): ReactElement {
  const [now, setNow] = useState(() => Date.now());
  const elapsedFor = useRef<number | null>(null);
  const onElapsedRef = useRef(onElapsed);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (deadlineMs === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [deadlineMs]);

  useEffect(() => {
    if (deadlineMs === null || elapsedFor.current === deadlineMs || !hasElapsed(deadlineMs, now)) return;
    elapsedFor.current = deadlineMs;
    onElapsedRef.current?.();
  }, [deadlineMs, now]);

  const seconds = deadlineMs === null ? totalSeconds : remainingSeconds(deadlineMs, now);
  const fraction = deadlineMs === null ? 1 : fractionRemaining(deadlineMs, totalSeconds, now);
  const warning = deadlineMs !== null && seconds <= warnBelowSeconds;
  const tone: ProgressRingTone = warning ? "red" : "accent";

  return (
    <span className="countdown-timer" role="timer" aria-label={label}>
      <ProgressRing label={label} value={fraction} max={1} size={size} tone={tone}>
        <span className="countdown-clock">{formatClock(seconds)}</span>
      </ProgressRing>
      {warning && warningText ? <span className="countdown-warning">{warningText}</span> : null}
    </span>
  );
}
