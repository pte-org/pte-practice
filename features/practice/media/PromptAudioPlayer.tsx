"use client";

import { type RefObject, useEffect, useState } from "react";
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

interface PromptAudioPlayerProps {
  url: string;
  label: string;
  /** The audio element that plays the prompt; the player only reads its position (timed prompts keep their own rules). */
  audio: RefObject<HTMLAudioElement | null>;
  /** Untimed: the student plays, pauses and seeks. Timed: display only — the prompt plays once on its own. */
  interactive: boolean;
}

/** Prompt audio as a round play button, its waveform (played part highlighted) and `0:12 / 1:24`. */
export function PromptAudioPlayer({ url, label, audio, interactive }: PromptAudioPlayerProps) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [position, setPosition] = useState({ current: 0, duration: 0, playing: false });

  useEffect(() => {
    let active = true;
    void loadPromptPeaks(url).then((loaded) => { if (active) setPeaks(loaded); });
    return () => { active = false; };
  }, [url]);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const sync = () => setPosition({ current: element.currentTime, duration: element.duration || 0, playing: !element.paused });
    const events = ["timeupdate", "loadedmetadata", "play", "pause", "ended"] as const;
    events.forEach((name) => element.addEventListener(name, sync));
    return () => events.forEach((name) => element.removeEventListener(name, sync));
  }, [audio, url]);

  const toggle = () => {
    const element = audio.current;
    if (!element || !interactive) return;
    if (element.paused) void element.play().catch(() => undefined);
    else element.pause();
  };
  const seek = (fraction: number) => {
    const element = audio.current;
    if (element && interactive && element.duration) seekTo(element, fraction * element.duration);
  };
  const progress = position.duration ? position.current / position.duration : 0;

  return (
    <div className="prompt-player">
      <button className="prompt-player-button" type="button" onClick={toggle} disabled={!interactive}
        aria-label={label}>
        <AppIcon name={position.playing ? "pause" : "play"} size={22} />
      </button>
      <div className="prompt-player-wave">
        {peaks ? <AudioWaveform peaks={peaks} progress={progress} label={label} onSeek={interactive ? seek : undefined} /> : null}
      </div>
      <span className="prompt-player-time">{formatTime(position.current)} / {formatTime(position.duration)}</span>
    </div>
  );
}
