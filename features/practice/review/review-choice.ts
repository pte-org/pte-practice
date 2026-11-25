import { selectedChoiceIds } from "../answer-payloads";
import type { PracticeOptionVerdict, PracticeReviewItem } from "../contracts";
import type { ChoiceOption } from "../renderers/ChoiceOptionList";
import { parsePayload } from "../session/session-draft";
import { isChoiceRenderer } from "../session/instant-feedback";

export interface ReviewChoiceView {
  options: ChoiceOption[];
  selected: string[];
  multiple: boolean;
  verdicts: readonly PracticeOptionVerdict[];
}

/**
 * Every option of a reviewed choice answer with what the student picked and which options were right, so the review
 * can mark them. Null when there is nothing to mark (another kind of answer, or a mock test not finished yet): the
 * review then shows the plain submitted answer.
 */
export function reviewChoiceView(item: PracticeReviewItem): ReviewChoiceView | null {
  const verdicts = item.result?.optionVerdicts ?? [];
  // A fill-in-the-blanks answer is marked too, but gap by gap on its own text, not as a list of options.
  if (verdicts.length === 0 || item.options.length === 0 || !isChoiceRenderer(item.rendererKey)) return null;
  const options = [...item.options]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((option) => ({ id: String(option.orderIndex), label: option.text }));
  return {
    options,
    selected: selectedChoiceIds(parsePayload(item.savedPayload)),
    multiple: item.taskCode.includes("MULTIPLE"),
    verdicts,
  };
}

/** The text of every right option: the answer key to show beside the score. */
export function correctOptionLabels(view: ReviewChoiceView): string[] {
  const rightIds = new Set(view.verdicts.filter((entry) => entry.correct).map((entry) => String(entry.orderIndex)));
  return view.options.filter((option) => rightIds.has(option.id)).map((option) => option.label);
}
