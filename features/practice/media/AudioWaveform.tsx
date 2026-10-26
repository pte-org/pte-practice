"use client";

import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
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
const DEFAULT_BAR_COUNT = 80;

function resampleBars(bars: readonly number[], target: number): number[] {
  if (bars.length === 0) return new Array(target).fill(0.12);
  if (bars.length === target) return [...bars];
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

/** Waveform of a recording as sleek, slender SVG bars matching the design spec. */
export function AudioWaveform({ peaks, progress = 0, label, onSeek }: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const normalized = normalizePeaks(peaks);
  const barCount = containerWidth > 0
    ? Math.max(20, Math.floor((containerWidth + BAR_GAP) / (BAR_WIDTH + BAR_GAP)))
    : DEFAULT_BAR_COUNT;

  const bars = resampleBars(normalized, barCount);
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
    <div ref={containerRef} className="audio-waveform-wrapper">
      <svg
        className={`audio-waveform${seekable ? " audio-waveform-seekable" : ""}`}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        preserveAspectRatio="none"
        role={seekable ? "slider" : "img"}
        aria-label={label}
        aria-valuemin={seekable ? 0 : undefined}
        aria-valuemax={seekable ? 100 : undefined}
        aria-valuenow={seekable ? Math.round(progress * 100) : undefined}
        tabIndex={seekable ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKey}
      >
        {bars.map((bar, index) => {
          const barHeight = Math.max(MIN_BAR_HEIGHT, Math.min(HEIGHT - 4, bar * (HEIGHT - 4)));
          const isPlayed = index < played;
          return (
            <rect
              key={index}
              className={`audio-waveform-bar${isPlayed ? " audio-waveform-bar-played" : ""}`}
              x={index * (BAR_WIDTH + BAR_GAP)}
              y={(HEIGHT - barHeight) / 2}
              width={BAR_WIDTH}
              height={barHeight}
              rx={1.25}
            />
          );
        })}
      </svg>
    </div>
  );
}
