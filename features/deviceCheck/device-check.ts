import { PRACTICE_STORAGE_KEYS } from "@/features/practice/constants";

/** The four device checks behind the Home skill tiles. */
export type DeviceCheckKind = "mic" | "speaker" | "keyboard" | "reading";

export const SKILL_DEVICE_CHECK: Record<string, DeviceCheckKind> = {
  SPEAKING: "mic",
  LISTENING: "speaker",
  WRITING: "keyboard",
  READING: "reading",
};

/** A passed check counts for a week; after that the tile asks again (devices and settings change). */
export const CHECK_VALID_DAYS = 7;
export const CHECK_VALID_MS = CHECK_VALID_DAYS * 24 * 60 * 60 * 1000;
const KEY_PREFIX = PRACTICE_STORAGE_KEYS.deviceCheckPrefix;
export const READING_SIZE_KEY = PRACTICE_STORAGE_KEYS.readingSize;

export type ReadingSize = "md" | "lg" | "xl";
export const READING_SIZES: readonly ReadingSize[] = ["md", "lg", "xl"];

export interface CheckStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): CheckStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export type DeviceCheckStatus = "passed" | "failed" | "not-checked";
export const CHECK_STATUS_FAILED = "failed";

export function getCheckStatus(kind: DeviceCheckKind, now = Date.now(), storage = browserStorage()): DeviceCheckStatus {
  try {
    const raw = storage?.getItem(KEY_PREFIX + kind);
    if (raw === CHECK_STATUS_FAILED) return "failed";
    const passedAt = Number(raw);
    if (Number.isFinite(passedAt) && passedAt > 0 && now - passedAt < CHECK_VALID_MS) {
      return "passed";
    }
    return "not-checked";
  } catch {
    return "not-checked";
  }
}

export function isCheckPassed(kind: DeviceCheckKind, now = Date.now(), storage = browserStorage()): boolean {
  return getCheckStatus(kind, now, storage) === "passed";
}

export function markCheckPassed(kind: DeviceCheckKind, now = Date.now(), storage = browserStorage()): void {
  try {
    storage?.setItem(KEY_PREFIX + kind, String(now));
  } catch {
    // A convenience only: a blocked store just means the tile asks again next time.
  }
}

export function markCheckFailed(kind: DeviceCheckKind, storage = browserStorage()): void {
  try {
    storage?.setItem(KEY_PREFIX + kind, CHECK_STATUS_FAILED);
  } catch {
    // best-effort
  }
}

export function clearCheckStatus(kind: DeviceCheckKind, storage = browserStorage()): void {
  try {
    storage?.removeItem(KEY_PREFIX + kind);
  } catch {
    // best-effort
  }
}

export type MicVerdict = "silent" | "quiet" | "loud" | "good";

/**
 * Judges a test recording from the loudest level heard (RMS, 0-1): nothing at all, too quiet to score, so loud it
 * likely clips, or fine. The thresholds are for a normal speaking voice about a hand's width from the microphone.
 */
export function micVerdict(maxLevel: number): MicVerdict {
  if (maxLevel < 0.01) return "silent";
  if (maxLevel < 0.04) return "quiet";
  if (maxLevel > 0.45) return "loud";
  return "good";
}

/** Letters a Vietnamese input method produces (Telex/VNI turn "ee" into "ê", "dd" into "đ", ...). */
const VIETNAMESE_LETTERS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

/** True when the typed text shows a Vietnamese keyboard is on, which garbles English answers. */
export function hasVietnameseInput(typed: string): boolean {
  return VIETNAMESE_LETTERS.test(typed.normalize("NFC"));
}

/** Words per minute, counting five characters as one word (the usual typing-test rule). */
export function wordsPerMinute(characters: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || characters <= 0) return 0;
  return Math.round((characters / 5) / (elapsedMs / 60_000));
}

export function readReadingSize(storage = browserStorage()): ReadingSize {
  try {
    const value = storage?.getItem(READING_SIZE_KEY);
    return READING_SIZES.find((size) => size === value) ?? "md";
  } catch {
    return "md";
  }
}

export function writeReadingSize(size: ReadingSize, storage = browserStorage()): void {
  try {
    storage?.setItem(READING_SIZE_KEY, size);
  } catch {
    // ignored, see markCheckPassed
  }
}
