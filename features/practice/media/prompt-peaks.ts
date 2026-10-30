import { computePeaks, normalizePeaks, WAVEFORM_BAR_COUNT } from "./waveform";

/**
 * A believable waveform for a prompt whose audio cannot be read (cross-origin or decode failure). Seeded by the URL's
 * stable part, so the same question always draws the same shape.
 */
export function fallbackPeaks(seed: string, count: number = WAVEFORM_BAR_COUNT): number[] {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return Array.from({ length: count }, (_, index) => {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    const noise = (state % 1000) / 1000;
    const envelope = 0.55 + 0.45 * Math.sin((index / count) * Math.PI);
    return Math.max(0.12, Math.min(1, envelope * (0.35 + 0.65 * noise)));
  });
}

/** The part of a (presigned) URL that does not change between links to the same file. */
export function stableUrlKey(url: string): string {
  return url.split("?")[0];
}

const cache = new Map<string, Promise<number[]>>();

/** Peaks of a prompt's audio, decoded once per file and cached; falls back to `fallbackPeaks` when unreadable. */
export function loadPromptPeaks(url: string): Promise<number[]> {
  const key = stableUrlKey(url);
  const cached = cache.get(key);
  if (cached) return cached;
  const loading = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const context = new AudioContext();
      try {
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        return normalizePeaks(computePeaks([buffer.getChannelData(0)]));
      } finally {
        void context.close();
      }
    } catch {
      return fallbackPeaks(key);
    }
  })();
  cache.set(key, loading);
  return loading;
}
