import { describe, expect, it } from "vitest";
import { seededShuffle } from "@/features/practice/seeded-shuffle";

describe("seededShuffle", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("is stable for the same seed and keeps every item", () => {
    const first = seededShuffle(items, "question-1");
    expect(seededShuffle(items, "question-1")).toEqual(first);
    expect(first.slice().sort()).toEqual(items);
    expect(items).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("never returns the original order when asked to avoid it", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      expect(seededShuffle(["a", "b"], `s${seed}`, { avoidOriginal: true })).toEqual(["b", "a"]);
      expect(seededShuffle(items, `s${seed}`, { avoidOriginal: true })).not.toEqual(items);
    }
  });
});
