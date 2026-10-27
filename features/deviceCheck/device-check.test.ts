import { describe, expect, it } from "vitest";
import {
  CHECK_VALID_MS,
  clearCheckStatus,
  getCheckStatus,
  hasVietnameseInput,
  isCheckPassed,
  markCheckFailed,
  markCheckPassed,
  micVerdict,
  readReadingSize,
  wordsPerMinute,
  writeReadingSize,
} from "./device-check";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
}

describe("check status", () => {
  it("is passed for a week after the check and not before it", () => {
    const storage = memoryStorage();
    expect(isCheckPassed("mic", 1_000, storage)).toBe(false);
    markCheckPassed("mic", 1_000, storage);
    expect(isCheckPassed("mic", 1_000 + CHECK_VALID_MS - 1, storage)).toBe(true);
    expect(isCheckPassed("mic", 1_000 + CHECK_VALID_MS, storage)).toBe(false);
    expect(isCheckPassed("speaker", 1_000, storage)).toBe(false);
  });

  it("handles failed and not-checked states correctly", () => {
    const storage = memoryStorage();
    expect(getCheckStatus("mic", 1_000, storage)).toBe("not-checked");
    markCheckFailed("mic", storage);
    expect(getCheckStatus("mic", 1_000, storage)).toBe("failed");
    expect(isCheckPassed("mic", 1_000, storage)).toBe(false);

    // Passing overrides failure
    markCheckPassed("mic", 1_000, storage);
    expect(getCheckStatus("mic", 1_000, storage)).toBe("passed");
    expect(isCheckPassed("mic", 1_000, storage)).toBe(true);

    // Failing overrides passing (e.g. permission revoked)
    markCheckFailed("mic", storage);
    expect(getCheckStatus("mic", 1_000, storage)).toBe("failed");
    expect(isCheckPassed("mic", 1_000, storage)).toBe(false);

    // Clear restores not-checked
    clearCheckStatus("mic", storage);
    expect(getCheckStatus("mic", 1_000, storage)).toBe("not-checked");
  });
});

describe("micVerdict", () => {
  it("tells silence, a quiet voice, clipping and a good level apart", () => {
    expect(micVerdict(0)).toBe("silent");
    expect(micVerdict(0.02)).toBe("quiet");
    expect(micVerdict(0.6)).toBe("loud");
    expect(micVerdict(0.15)).toBe("good");
  });
});

describe("keyboard check", () => {
  it("spots a Vietnamese input method", () => {
    expect(hasVietnameseInput("The weather was nice")).toBe(false);
    expect(hasVietnameseInput("The wêather was nice")).toBe(true);
    expect(hasVietnameseInput("đo")).toBe(true);
  });

  it("counts five characters as a word", () => {
    expect(wordsPerMinute(250, 60_000)).toBe(50);
    expect(wordsPerMinute(0, 60_000)).toBe(0);
    expect(wordsPerMinute(10, 0)).toBe(0);
  });
});

describe("reading size", () => {
  it("defaults to medium and remembers a valid choice", () => {
    const storage = memoryStorage();
    expect(readReadingSize(storage)).toBe("md");
    writeReadingSize("xl", storage);
    expect(readReadingSize(storage)).toBe("xl");
    storage.setItem("pte.practice.reading-size", "huge");
    expect(readReadingSize(storage)).toBe("md");
  });
});
