"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { normalizePeaks, playedBars, seekFraction } from "./waveform";

interface AudioWaveformProps {
  /** One amplitude (0..1) per bar. */
  peaks: readonly number[];
  /** Played fraction (0..1); the bars before it are drawn in the accent colour. */
  progress?: number;
  /** Accessible name of the waveform. */
  label: string;
  /** Called with a fraction (0..1) when the student clicks or uses the arrow keys; omit for a read-only waveform. */
  onSeek?: (fraction: number) => void;
}

const KEY_STEP = 0.05;
const TARGET_BAR_COUNT = 80;

function resampleBars(bars: readonly number[], target: number): number[] {
  if (bars.length === 0) return new Array(target).fill(0.12);
  if (bars.length >= target) return [...bars];
  const out = new Array<number>(target);
  for (let i = 0; i < target; i++) {
    const t = (i / (target - 1)) * (bars.length - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(bars.length - 1, i0 + 1);
    const f = t - i0;
    out[i] = bars[i0] * (1 - f) + bars[i1] * f;
  }
  return out;
}

/** Waveform of a recording as sleek, slender flex capsules. Never stretches into fat bars on wide screens. */
export function AudioWaveform({ peaks, progress = 0, label, onSeek }: AudioWaveformProps) {
  const normalized = normalizePeaks(peaks);
  const bars = resampleBars(normalized, TARGET_BAR_COUNT);
  const played = playedBars(progress, bars.length);
  const seekable = Boolean(onSeek);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!onSeek) return;
    const box = event.currentTarget.getBoundingClientRect();
    onSeek(seekFraction(event.clientX - box.left, box.width));
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSeek) return;
    if (event.key === "ArrowRight") { event.preventDefault(); onSeek(Math.min(1, progress + KEY_STEP)); }
    if (event.key === "ArrowLeft") { event.preventDefault(); onSeek(Math.max(0, progress - KEY_STEP)); }
  }

  return (
    <div
      className={`audio-waveform${seekable ? " audio-waveform-seekable" : ""}`}
      role={seekable ? "slider" : "img"}
      aria-label={label}
      aria-valuemin={seekable ? 0 : undefined}
      aria-valuemax={seekable ? 100 : undefined}
      aria-valuenow={seekable ? Math.round(progress * 100) : undefined}
      tabIndex={seekable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
    >
      <div className="audio-waveform-bars">
        {bars.map((bar, index) => {
          const heightPercent = Math.max(12, Math.min(100, Math.round(bar * 100)));
          return (
            <span
              key={index}
              className={`audio-waveform-bar${index < played ? " audio-waveform-bar-played" : ""}`}
              style={{ height: `${heightPercent}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
