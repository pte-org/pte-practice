function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG (mulberry32) so the same seed always gives the same order. */
function randomFrom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

interface ShuffleOptions {
  /** Never return the input order (when there is more than one distinct arrangement). */
  avoidOriginal?: boolean;
}

/** Fisher-Yates shuffle with a seeded generator; the input is left untouched. */
export function seededShuffle<T>(items: readonly T[], seed: string, options: ShuffleOptions = {}): T[] {
  const result = items.slice();
  if (result.length < 2) return result;
  const random = randomFrom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  if (options.avoidOriginal && result.every((item, index) => item === items[index])) {
    // Rotating by one keeps the result deterministic and differs from the original for any length >= 2.
    result.push(result.shift() as T);
  }
  return result;
}
