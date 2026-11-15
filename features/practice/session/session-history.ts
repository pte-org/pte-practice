import type { PracticeItemResult, PracticeReviewItem, PracticeTaskResponse } from "../contracts";
import type { PracticeTaskFixture } from "../fixtures";
import { fixtureFromPracticeTask } from "../task-content";
import { parsePayload } from "./session-draft";

/** A question already answered or skipped in this run, reachable with "Trước". */
export interface HistoryItem {
  task: PracticeTaskResponse;
  fixture: PracticeTaskFixture | null;
  answer: Record<string, unknown>;
  result: PracticeItemResult | null;
  timeSpentSeconds: number;
  isSkipped?: boolean;
}

/** The answered and skipped questions of a resumed session, rebuilt from its review. */
export function historyFromReview(items: readonly PracticeReviewItem[]): HistoryItem[] {
  return items.filter((item) => item.status === "ANSWERED" || item.status === "SKIPPED").map((item) => {
    const task: PracticeTaskResponse = {
      publicId: item.publicId,
      orderIndex: item.orderIndex,
      taskCode: item.taskCode,
      displayName: item.displayName,
      section: item.section,
      rendererKey: item.rendererKey,
      contractVersion: 1,
      answerSchemaVersion: 1,
      status: item.status,
      savedPayload: item.savedPayload,
      confidence: null,
      content: {
        promptText: item.promptText,
        minWordCount: null,
        maxWordCount: null,
        audioPromptRef: null,
        imagePromptRef: null,
        options: item.options,
        audioUrl: null,
        imageUrl: null,
      },
      timing: null,
    };
    return {
      task,
      fixture: fixtureFromPracticeTask(task),
      answer: parsePayload(item.savedPayload),
      result: item.status === "ANSWERED" ? pendingResult(item.publicId, item.taskCode, item.score) : null,
      timeSpentSeconds: 0,
      isSkipped: item.status === "SKIPPED",
    };
  });
}

/** The result shown for an answer before (or without) scoring: scored when a score exists, else waiting. */
export function pendingResult(itemPublicId: string, taskCode: string, score: number | null = null): PracticeItemResult {
  return {
    itemPublicId,
    taskCode,
    state: score !== null ? "SCORED" : "SCORING",
    score: score ?? 0,
    scoreStatus: null,
    subScores: {},
    feedback: null,
    transcript: null,
    failureCode: null,
    retryable: false,
    scoredAt: null,
  };
}
