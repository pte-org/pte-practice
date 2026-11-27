import { asNullableNumber, asNullableString, asRecord, asString } from "./contract-helpers";
import { normalizeAnswerFeedback, type PracticeAnswerFeedback } from "./feedback-contracts";

export type PracticeScoringState = "NONE" | "SCORING" | "SCORED" | "FAILED";

/** One option of a scored answer with a fixed key: whether the student picked it and whether it is a correct one. */
export interface PracticeOptionVerdict {
  /** The option's position; the renderer's option id is its string form. */
  orderIndex: number;
  selected: boolean;
  correct: boolean;
  /** The gap this option belongs to in a fill-in-the-blanks answer; absent for a choice answer. */
  blankIndex?: number;
  /** What the option reads, so a gap can show the word that belonged in it. */
  text?: string;
}

export interface PracticeItemResult {
  itemPublicId: string;
  taskCode: string;
  state: PracticeScoringState;
  score: number | null;
  scoreStatus: string | null;
  subScores: Record<string, number>;
  /**
   * Maximum per sub-score, present only when the sub-scores are Pearson trait scores of a rubric version (shown as
   * achieved / max). Absent for older results, whose sub-scores are raw numbers.
   */
  subScoreMax?: Record<string, number>;
  feedback: string | null;
  transcript: string | null;
  /** Transcript of an audio-only task; the server releases it only once the item is answered. */
  promptText?: string | null;
  failureCode: string | null;
  retryable: boolean;
  scoredAt: string | null;
  /** Reasons, tips and word marks of a scored answer; absent when the scorer wrote none. */
  feedbackDetail?: PracticeAnswerFeedback;
  /** Right or wrong per option of a scored choice answer; absent for other answers and for an unfinished mock test. */
  optionVerdicts?: PracticeOptionVerdict[];
}

function normalizeOptionVerdicts(value: unknown): PracticeOptionVerdict[] {
  return Array.isArray(value) ? value.flatMap((entry) => {
    const verdict = asRecord(entry);
    if (typeof verdict.orderIndex !== "number" || !Number.isInteger(verdict.orderIndex)) return [];
    return [{
      orderIndex: verdict.orderIndex,
      selected: verdict.selected === true,
      correct: verdict.correct === true,
      ...(Number.isInteger(verdict.blankIndex) ? { blankIndex: verdict.blankIndex as number } : {}),
      ...(typeof verdict.text === "string" ? { text: verdict.text } : {}),
    }];
  }) : [];
}

export function normalizePracticeItemResult(value: unknown): PracticeItemResult | null {
  const record = asRecord(value);
  const itemPublicId = asString(record.itemPublicId, "");
  const state = record.state === "NONE" || record.state === "SCORING" || record.state === "SCORED"
    || record.state === "FAILED" ? record.state : null;
  if (!itemPublicId || !state) return null;
  const subScoreMax = normalizeSubScores(record.subScoreMax);
  const feedbackDetail = normalizeAnswerFeedback(record.feedbackDetail);
  const optionVerdicts = normalizeOptionVerdicts(record.optionVerdicts);
  return {
    itemPublicId,
    taskCode: asString(record.taskCode, ""),
    state,
    score: asNullableNumber(record.score),
    scoreStatus: asNullableString(record.scoreStatus),
    subScores: normalizeSubScores(record.subScores),
    ...(Object.keys(subScoreMax).length > 0 ? { subScoreMax } : {}),
    feedback: asNullableString(record.feedback),
    transcript: asNullableString(record.transcript),
    promptText: asNullableString(record.promptText),
    failureCode: asNullableString(record.failureCode),
    retryable: Boolean(record.retryable),
    scoredAt: asNullableString(record.scoredAt),
    ...(feedbackDetail ? { feedbackDetail } : {}),
    ...(optionVerdicts.length > 0 ? { optionVerdicts } : {}),
  };
}

export function normalizeSubScores(value: unknown): Record<string, number> {
  return Object.fromEntries(Object.entries(asRecord(value))
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])));
}
