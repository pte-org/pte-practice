"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/common/components";
import { AudioWaveform } from "./AudioWaveform";
import { loadPromptPeaks } from "./prompt-peaks";

function formatTime(seconds: number): string {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Moves playback; kept outside the component because the audio element is owned by the caller. */
function seekTo(element: HTMLAudioElement, seconds: number): void {
  element.currentTime = seconds;
}

export interface PromptAudioPlayerProps {
  url: string;
  label: string;
  /** Pre-calculated waveform peaks; if omitted, peaks are loaded from the url. */
  peaks?: number[] | null;
  /** The audio element that plays the prompt; if omitted, the player renders its own internal audio element. */
  audio?: RefObject<HTMLAudioElement | null>;
  /** Untimed: the student plays, pauses and seeks. Timed: display only — the prompt plays once on its own. */
  interactive?: boolean;
  autoPlay?: boolean;
  className?: string;
}

/** Modern audio media player: circular play button in system blue, audio waveform bars, and `0:01 / 1:24` timestamp. */
export function PromptAudioPlayer({
  url,
  label,
  peaks: initialPeaks,
  audio,
  interactive = true,
  autoPlay = false,
  className,
}: PromptAudioPlayerProps) {
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudio = audio ?? internalAudioRef;
  const [loadedPeaks, setLoadedPeaks] = useState<number[] | null>(null);
  const [position, setPosition] = useState({ current: 0, duration: 0, playing: false });

  const peaks = initialPeaks ?? loadedPeaks;

  useEffect(() => {
    if (initialPeaks) return;
    let active = true;
    void loadPromptPeaks(url).then((loaded) => { if (active) setLoadedPeaks(loaded); });
    return () => { active = false; };
  }, [url, initialPeaks]);

  useEffect(() => {
    const element = activeAudio.current;
    if (!element) return;
    const sync = () => setPosition({ current: element.currentTime, duration: element.duration || 0, playing: !element.paused });
    const events = ["timeupdate", "loadedmetadata", "play", "pause", "ended"] as const;
    events.forEach((name) => element.addEventListener(name, sync));
    sync();
    return () => events.forEach((name) => element.removeEventListener(name, sync));
  }, [activeAudio, url]);

  const toggle = () => {
    const element = activeAudio.current;
    if (!element || !interactive) return;
    if (element.paused) void element.play().catch(() => undefined);
    else element.pause();
  };
  const seek = (fraction: number) => {
    const element = activeAudio.current;
    if (element && interactive && element.duration) seekTo(element, fraction * element.duration);
  };
  const progress = position.duration ? position.current / position.duration : 0;

  return (
    <div className={`prompt-player${className ? ` ${className}` : ""}`}>
      {!audio ? (
        <audio ref={internalAudioRef} src={url} preload="auto" autoPlay={autoPlay} aria-hidden="true" />
      ) : null}
      <button
        className="prompt-player-button"
        type="button"
        onClick={toggle}
        disabled={!interactive}
        aria-label={label}
        data-state={position.playing ? "pause" : "play"}
      >
        <AppIcon name={position.playing ? "pause" : "play"} size={20} />
      </button>
      <div className="prompt-player-wave">
        {peaks ? <AudioWaveform peaks={peaks} progress={progress} label={label} onSeek={interactive ? seek : undefined} /> : null}
      </div>
      <span className="prompt-player-time">{formatTime(position.current)} / {formatTime(position.duration)}</span>
    </div>
  );
}

export { PromptAudioPlayer as MediaPlayer };
