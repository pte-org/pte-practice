/** Number of bars drawn for a finished recording. */
export const WAVEFORM_BAR_COUNT = 64;

/** Peak amplitude (0..1) of each of `barCount` equal slices of the PCM chunks; silence yields zeros. */
export function computePeaks(chunks: readonly Float32Array[], barCount: number = WAVEFORM_BAR_COUNT): number[] {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const peaks = new Array<number>(barCount).fill(0);
  if (total === 0 || barCount <= 0) return peaks;
  let position = 0;
  for (const chunk of chunks) {
    for (const sample of chunk) {
      const bar = Math.min(barCount - 1, Math.floor((position * barCount) / total));
      const magnitude = Math.min(1, Math.abs(sample));
      if (magnitude > peaks[bar]) peaks[bar] = magnitude;
      position += 1;
    }
  }
  return peaks;
}

/** Scales peaks so the loudest bar is 1, so quiet recordings still show a readable shape. */
export function normalizePeaks(peaks: readonly number[]): number[] {
  const loudest = Math.max(0, ...peaks);
  return loudest === 0 ? peaks.map(() => 0) : peaks.map((peak) => peak / loudest);
}

/** Root-mean-square level (0..1) of one audio buffer, for the live input meter. */
export function rmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.min(1, Math.sqrt(sum / samples.length));
}

/** Fraction (0..1) of the waveform width a pointer is at; used to seek on click and with the keyboard. */
export function seekFraction(offsetX: number, width: number): number {
  if (!(width > 0)) return 0;
  return Math.min(1, Math.max(0, offsetX / width));
}

/** Number of bars already played at `progress` (0..1). */
export function playedBars(progress: number, barCount: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * barCount);
}

/** Clamps a measured recording length to what the server accepts: at least 1 s, at most the cap. */
export function clampRecordingDuration(seconds: number, maxSeconds: number): number {
  return Math.max(1, Math.min(maxSeconds, Math.round(seconds)));
}

/** Live levels laid out on a fixed number of bars: the newest sit on the right, the rest is empty. */
export function padLevels(levels: readonly number[], barCount: number = WAVEFORM_BAR_COUNT): number[] {
  const recent = levels.slice(-barCount);
  return [...new Array<number>(barCount - recent.length).fill(0), ...recent];
}
