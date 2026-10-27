import { normalizeEstimatedScores } from "../mockTests/mock-test-contracts";
import { asRecord } from "./contract-helpers";
import type { PracticeReview, PracticeTaskContentOption } from "./contracts";

function reviewOptions(value: unknown): PracticeTaskContentOption[] {
  return Array.isArray(value) ? value.flatMap((entry) => {
    const option = asRecord(entry);
    if (typeof option.text !== "string" || typeof option.orderIndex !== "number") return [];
    return [{ text: option.text, orderIndex: option.orderIndex, blankIndex: typeof option.blankIndex === "number" ? option.blankIndex : null }];
  }) : [];
}

/** Reads a session review; malformed items are dropped, a missing estimate is null. */
export function normalizeReview(response: unknown, sessionPublicId: string): PracticeReview {
  const record = asRecord(response);
  const items = Array.isArray(record.items) ? record.items.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const item = value as Record<string, unknown>;
    if (typeof item.publicId !== "string" || typeof item.taskCode !== "string") return [];
    const status: "ANSWERED" | "SKIPPED" | "PENDING" = item.status === "ANSWERED" || item.status === "SKIPPED" ? item.status : "PENDING";
    return [{ publicId: item.publicId, orderIndex: typeof item.orderIndex === "number" ? item.orderIndex : 0,
      taskCode: item.taskCode, displayName: typeof item.displayName === "string" ? item.displayName : item.taskCode,
      section: typeof item.section === "string" ? item.section : "UNKNOWN", status,
      promptText: typeof item.promptText === "string" ? item.promptText : null,
      savedPayload: typeof item.savedPayload === "string" ? item.savedPayload : null,
      rendererKey: typeof item.rendererKey === "string" ? item.rendererKey : null,
      options: reviewOptions(item.options),
      score: typeof item.aiScore === "number" ? item.aiScore : typeof item.objectiveScore === "number" ? item.objectiveScore : null }];
  }) : [];
  return { sessionPublicId: typeof record.sessionPublicId === "string" ? record.sessionPublicId : sessionPublicId, items,
    estimatedScores: normalizeEstimatedScores(record.estimatedScores) };
}
