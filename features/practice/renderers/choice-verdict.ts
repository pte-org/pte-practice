import type { PracticeOptionVerdict } from "../result-contracts";

/** How one option looks once its answer is scored: picked and right, picked and wrong, a right one left out, or plain. */
export type ChoiceMark = "right" | "wrong" | "missed" | "none";

/** How the whole answer did, for the line above the options. */
export type ChoiceOutcome = "correct" | "partial" | "incorrect";

/** The renderer's option id is the option's position as a string, which is what the verdicts are keyed by. */
export function choiceMark(optionId: string, verdicts: readonly PracticeOptionVerdict[]): ChoiceMark {
  const verdict = verdicts.find((entry) => String(entry.orderIndex) === optionId);
  if (!verdict) return "none";
  if (verdict.selected) return verdict.correct ? "right" : "wrong";
  return verdict.correct ? "missed" : "none";
}

/** Correct when nothing is wrong or left out, incorrect when no pick is right, partial in between; null without verdicts. */
export function choiceOutcome(verdicts: readonly PracticeOptionVerdict[]): ChoiceOutcome | null {
  if (verdicts.length === 0) return null;
  const right = verdicts.filter((entry) => entry.selected && entry.correct).length;
  const flawed = verdicts.filter((entry) => entry.selected !== entry.correct).length;
  if (flawed === 0) return "correct";
  return right === 0 ? "incorrect" : "partial";
}

/** Translation key of the line that names an outcome, shared by the option list and the result card. */
export const OUTCOME_TEXT = {
  correct: "session.correct", partial: "session.partiallyCorrect", incorrect: "session.incorrect",
} as const satisfies Record<ChoiceOutcome, string>;
