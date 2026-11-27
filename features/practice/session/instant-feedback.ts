import { MOCK_TEST_KIND } from "../constants";
import type { PracticeSession, PracticeTaskResponse } from "../contracts";

/** Choice renderers whose answer is scored on the spot and comes back with a right/wrong verdict per option. */
const SINGLE_CHOICE_RENDERERS: ReadonlySet<string> = new Set([
  "MC_READING_SINGLE_V1", "MC_LISTENING_SINGLE_V1", "SELECT_MISSING_WORD_V1", "HIGHLIGHT_CORRECT_SUMMARY_V1",
]);
const MULTIPLE_CHOICE_RENDERERS: ReadonlySet<string> = new Set(["MC_READING_MULTIPLE_V1", "MC_LISTENING_MULTIPLE_V1"]);
/** Fill-in-the-blanks renderers: also scored on the spot, but a gap at a time, so they wait for the check button. */
const BLANK_RENDERERS: ReadonlySet<string> = new Set([
  "FILL_IN_THE_BLANKS_DROPDOWN_V1", "FILL_IN_THE_BLANKS_DRAG_AND_DROP_V1",
]);

/** Whether the renderer picks from a list of options, which is marked right or wrong option by option. */
export function isChoiceRenderer(rendererKey: string | null): boolean {
  return rendererKey !== null
    && (SINGLE_CHOICE_RENDERERS.has(rendererKey) || MULTIPLE_CHOICE_RENDERERS.has(rendererKey));
}

type SessionKind = Pick<PracticeSession, "kind">;
type TaskRenderer = Pick<PracticeTaskResponse, "rendererKey">;

/**
 * The question shows right and wrong before the student moves on. A mock test is an exam rehearsal, so it never
 * does while it is being sat; AI-scored and multi-step answers keep the plain "Tiếp theo" flow.
 */
export function showsAnswerCheck(session: SessionKind, task: TaskRenderer): boolean {
  const key = task.rendererKey;
  return session.kind !== MOCK_TEST_KIND && key !== null && (isChoiceRenderer(key) || BLANK_RENDERERS.has(key));
}

/** One click settles a single-choice answer, so it is sent at once; a multiple-choice one waits for "Kiểm tra". */
export function checksOnSelect(session: SessionKind, task: TaskRenderer): boolean {
  return showsAnswerCheck(session, task) && task.rendererKey !== null && SINGLE_CHOICE_RENDERERS.has(task.rendererKey);
}

/** Whether a sent answer came back with verdicts, so the screen stays on it instead of moving to the next question. */
export function hasVerdicts(result: { optionVerdicts?: readonly unknown[] } | null | undefined): boolean {
  return Boolean(result?.optionVerdicts && result.optionVerdicts.length > 0);
}
