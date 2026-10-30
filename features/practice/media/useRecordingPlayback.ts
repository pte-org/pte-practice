"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RecordingPlayback {
  playing: boolean;
  /** Played fraction, 0..1. */
  progress: number;
  toggle: () => void;
  seek: (fraction: number) => void;
}

/**
 * Plays one recording. `source` is a local blob URL right after recording; when it is null, `resolveUrl` fetches a
 * fresh server link on the first play (the link of a saved recording is short-lived, so it is never fetched early).
 */
export function useRecordingPlayback(source: string | null, resolveUrl: (() => Promise<string>) | null,
  onError: () => void): RecordingPlayback {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [trackedSource, setTrackedSource] = useState(source);
  if (trackedSource !== source) {
    // A different recording (or none): start from the beginning instead of showing the old position.
    setTrackedSource(source);
    setPlaying(false);
    setProgress(0);
  }

  useEffect(() => () => {
    // Also runs when the source changes, so the next play builds an element for the new source.
    audio.current?.pause();
    audio.current = null;
  }, [source]);

  const element = useCallback(async (): Promise<HTMLAudioElement | null> => {
    if (audio.current) return audio.current;
    const url = source ?? (resolveUrl ? await resolveUrl() : null);
    if (!url) return null;
    const created = new Audio(url);
    created.addEventListener("timeupdate", () => {
      setProgress(created.duration > 0 ? created.currentTime / created.duration : 0);
    });
    created.addEventListener("ended", () => { setPlaying(false); setProgress(0); });
    created.addEventListener("pause", () => setPlaying(false));
    created.addEventListener("play", () => setPlaying(true));
    created.addEventListener("error", onError);
    audio.current = created;
    return created;
  }, [onError, resolveUrl, source]);

  const toggle = useCallback(() => {
    void element().then((media) => {
      if (!media) return;
      if (media.paused) return media.play();
      media.pause();
    }).catch(onError);
  }, [element, onError]);

  const seek = useCallback((fraction: number) => {
    void element().then((media) => {
      if (media && media.duration > 0) media.currentTime = fraction * media.duration;
    }).catch(onError);
  }, [element, onError]);

  return { playing, progress, toggle, seek };
}
