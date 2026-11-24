import type { PracticeReviewItem } from "../contracts";
import { blankMarks, hasBlankVerdicts, type BlankState } from "../renderers/blank-verdict";
import { parsePayload } from "../session/session-draft";

export interface ReviewBlankRow {
  /** The gap's position, counted from 0 as the prompt writes it. */
  gap: number;
  /** What the student put in the gap; empty when they left it. */
  chosenWord: string;
  correctWord: string;
  state: BlankState;
}

/**
 * Every gap of a reviewed fill-in-the-blanks answer with what went in it and what belonged there, gaps the student
 * left included. Null for any other answer, which the review shows as it did before.
 */
export function reviewBlankRows(item: PracticeReviewItem): ReviewBlankRow[] | null {
  const verdicts = item.result?.optionVerdicts ?? [];
  if (!hasBlankVerdicts(verdicts)) return null;
  const payload = parsePayload(item.savedPayload);
  const byGap = payload.selections ?? payload.placements;
  const chosen = typeof byGap === "object" && byGap !== null ? byGap as Record<string, unknown> : {};
  return [...blankMarks(verdicts).entries()]
    .sort(([left], [right]) => left - right)
    .map(([gap, mark]) => ({
      gap,
      chosenWord: typeof chosen[String(gap)] === "string" ? chosen[String(gap)] as string : "",
      correctWord: mark.correctWord,
      state: mark.state,
    }));
}
