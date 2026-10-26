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

const BAR_WIDTH = 2.5;
const BAR_GAP = 2.5;
const HEIGHT = 44;
const MIN_BAR_HEIGHT = 4;
const KEY_STEP = 0.05;

/** Waveform of a recording as SVG bars. Classes carry the colours, so it follows the light and dark themes. */
export function AudioWaveform({ peaks, progress = 0, label, onSeek }: AudioWaveformProps) {
  const bars = normalizePeaks(peaks);
  const width = bars.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
  const played = playedBars(progress, bars.length);
  const seekable = Boolean(onSeek);

  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (!onSeek) return;
    const box = event.currentTarget.getBoundingClientRect();
    onSeek(seekFraction(event.clientX - box.left, box.width));
  }

  function handleKey(event: KeyboardEvent<SVGSVGElement>) {
    if (!onSeek) return;
    if (event.key === "ArrowRight") { event.preventDefault(); onSeek(Math.min(1, progress + KEY_STEP)); }
    if (event.key === "ArrowLeft") { event.preventDefault(); onSeek(Math.max(0, progress - KEY_STEP)); }
  }

  return (
    <svg className={`audio-waveform${seekable ? " audio-waveform-seekable" : ""}`} viewBox={`0 0 ${width} ${HEIGHT}`}
      preserveAspectRatio="none" role={seekable ? "slider" : "img"} aria-label={label}
      aria-valuemin={seekable ? 0 : undefined} aria-valuemax={seekable ? 100 : undefined}
      aria-valuenow={seekable ? Math.round(progress * 100) : undefined}
      tabIndex={seekable ? 0 : undefined} onClick={handleClick} onKeyDown={handleKey}>
      {bars.map((bar, index) => {
        const height = Math.max(MIN_BAR_HEIGHT, bar * HEIGHT);
        return (
          <rect key={index} className={index < played ? "audio-waveform-bar audio-waveform-bar-played" : "audio-waveform-bar"}
            x={index * (BAR_WIDTH + BAR_GAP)} y={(HEIGHT - height) / 2} width={BAR_WIDTH} height={height} rx={BAR_WIDTH / 2} />
        );
      })}
    </svg>
  );
}
