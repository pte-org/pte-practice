import type { PracticeOptionVerdict } from "../contracts";
import { choiceOutcome, type ChoiceOutcome } from "../renderers/choice-verdict";

/** Task types scored against a fixed answer key (never by the AI): their result is a plain score, not an AI report. */
const OBJECTIVE_TASK_CODES: ReadonlySet<string> = new Set([
  "MC_READING_SINGLE", "MC_READING_MULTIPLE", "MC_LISTENING_SINGLE", "MC_LISTENING_MULTIPLE",
  "HIGHLIGHT_CORRECT_SUMMARY", "SELECT_MISSING_WORD", "RE_ORDER_PARAGRAPHS", "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
  "FILL_IN_THE_BLANKS_DROPDOWN", "FILL_IN_THE_BLANKS_TYPE_IN", "HIGHLIGHT_INCORRECT_WORDS", "WRITE_FROM_DICTATION",
]);

export function isObjectiveTask(taskCode: string): boolean {
  return OBJECTIVE_TASK_CODES.has(taskCode);
}

export interface VerdictTally {
  /** Options the student picked that are right. */
  right: number;
  /** Options the student picked that are wrong. */
  wrong: number;
  /** Right options the student left out. */
  missed: number;
}

export function tallyVerdicts(verdicts: readonly PracticeOptionVerdict[]): VerdictTally {
  return {
    right: verdicts.filter((entry) => entry.selected && entry.correct).length,
    wrong: verdicts.filter((entry) => entry.selected && !entry.correct).length,
    missed: verdicts.filter((entry) => !entry.selected && entry.correct).length,
  };
}

/**
 * How the answer did: read from the options when they are known (a pick can be right while the score is 0 because a
 * wrong pick cancels it), else from the score alone (all of it, none of it, or something in between).
 */
export function objectiveOutcome(score: number, verdicts: readonly PracticeOptionVerdict[]): ChoiceOutcome {
  const fromOptions = choiceOutcome(verdicts);
  if (fromOptions) return fromOptions;
  if (score >= 100) return "correct";
  return score <= 0 ? "incorrect" : "partial";
}
