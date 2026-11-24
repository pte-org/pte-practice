import type { PracticeOptionVerdict } from "../result-contracts";

/** How one gap of a scored fill-in-the-blanks answer did. */
export type BlankState = "right" | "wrong" | "empty";

export interface BlankMark {
  state: BlankState;
  /** The word that belonged in the gap; empty when the key does not name one. */
  correctWord: string;
}

/** True when the verdicts belong to a fill-in-the-blanks answer, whose options each sit in one gap. */
export function hasBlankVerdicts(verdicts: readonly PracticeOptionVerdict[]): boolean {
  return verdicts.some((verdict) => verdict.blankIndex !== undefined);
}

/**
 * What to mark on each gap of a scored fill-in-the-blanks answer, keyed by the gap's position. A gap the student
 * left empty is marked as such rather than wrong, so nothing reads as a mistake the student did not make.
 */
export function blankMarks(verdicts: readonly PracticeOptionVerdict[]): Map<number, BlankMark> {
  const marks = new Map<number, BlankMark>();
  for (const verdict of verdicts) {
    const gap = verdict.blankIndex;
    if (gap === undefined) continue;
    const mark = marks.get(gap) ?? { state: "empty" as BlankState, correctWord: "" };
    if (verdict.correct && verdict.text) mark.correctWord = verdict.text;
    if (verdict.selected) mark.state = verdict.correct ? "right" : "wrong";
    marks.set(gap, mark);
  }
  return marks;
}
