import type { PracticeTimingMode } from "../session-contracts";

/** 50 is the server maximum and stands for "all the questions of this task type". */
export const QUESTION_COUNT_OPTIONS = [5, 10, 50] as const;
export type QuestionCountOption = typeof QUESTION_COUNT_OPTIONS[number];
export const ALL_QUESTIONS_COUNT: QuestionCountOption = 50;

export interface ModePreference {
  timingMode: PracticeTimingMode;
  questionCount: QuestionCountOption;
}

export const DEFAULT_MODE_PREFERENCE: ModePreference = { timingMode: "UNTIMED", questionCount: 10 };

/** The slice of `Storage` this module needs, so tests can pass a fake and the browser one can be missing. */
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEY_PREFIX = "pte.practice.mode.";

function key(taskCode: string): string {
  return `${KEY_PREFIX}${taskCode}`;
}

function browserStorage(): PreferenceStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isQuestionCountOption(value: unknown): value is QuestionCountOption {
  return QUESTION_COUNT_OPTIONS.some((option) => option === value);
}

/** Reads a stored preference; anything missing, corrupt or out of range falls back to the default. */
export function parseModePreference(raw: string | null): ModePreference {
  if (!raw) return DEFAULT_MODE_PREFERENCE;
  try {
    const value: unknown = JSON.parse(raw);
    const record = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
    return {
      timingMode: record.timingMode === "TIMED" ? "TIMED" : DEFAULT_MODE_PREFERENCE.timingMode,
      questionCount: isQuestionCountOption(record.questionCount)
        ? record.questionCount : DEFAULT_MODE_PREFERENCE.questionCount,
    };
  } catch {
    return DEFAULT_MODE_PREFERENCE;
  }
}

/** The mode and question count the student used last for this task type. */
export function readModePreference(taskCode: string, storage: PreferenceStorage | null = browserStorage()): ModePreference {
  try {
    return parseModePreference(storage ? storage.getItem(key(taskCode)) : null);
  } catch {
    return DEFAULT_MODE_PREFERENCE;
  }
}

export function writeModePreference(taskCode: string, preference: ModePreference,
  storage: PreferenceStorage | null = browserStorage()): void {
  try {
    storage?.setItem(key(taskCode), JSON.stringify(preference));
  } catch {
    // A convenience only: a full or blocked store must never stop the student from starting.
  }
}
