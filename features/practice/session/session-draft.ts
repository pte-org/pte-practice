import type { PracticeSession } from "../contracts";

/** Reads the saved answer payload of an item; anything that is not a JSON object reads as no answer. */
export function parsePayload(payload: string | null): Record<string, unknown> {
  if (!payload) return {};
  try {
    const value: unknown = JSON.parse(payload);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

/** The local draft wins only for the item it was typed for; otherwise the answer the server saved is shown. */
export function effectiveDraft(task: { publicId: string; savedPayload: string | null }, draftTaskId: string | null,
  draft: Record<string, unknown>): Record<string, unknown> {
  return draftTaskId === task.publicId ? draft : parsePayload(task.savedPayload);
}

export function hasAnswer(value: Record<string, unknown>): boolean {
  return Object.values(value).some((entry) => Array.isArray(entry)
    ? entry.some((item) => typeof item !== "string" || item.trim().length > 0)
    : typeof entry === "object" && entry !== null ? Object.keys(entry).length > 0
      : typeof entry === "string" && entry.trim().length > 0);
}

/** Share of the progress bar to fill: the position of the current item, never less than a visible sliver. */
export function progressFor(session: Pick<PracticeSession, "totalItemCount" | "status" | "currentTask">): number {
  if (!session.totalItemCount) return 4;
  if (session.status === "COMPLETED") return 100;
  const position = session.currentTask ? session.currentTask.orderIndex / session.totalItemCount : 0;
  return Math.min(100, Math.max(4, position * 100));
}

/** One-based position of the current item for the "3/10" counter. */
export function currentTaskPosition(session: Pick<PracticeSession, "totalItemCount" | "currentTask">): number {
  if (!session.currentTask) return session.totalItemCount;
  return Math.min(session.totalItemCount, session.currentTask.orderIndex + 1);
}

export interface SessionErrorLike {
  status?: number;
  code?: string | null;
  message?: string;
}

export interface SessionErrorMessages {
  conflict: string;
  expired: string;
  fallback: string;
}

/** Maps an API failure to the message shown to the student; stale version and expiry have their own wording. */
export function sessionErrorMessage(reason: unknown, messages: SessionErrorMessages): string {
  const error = reason as SessionErrorLike | undefined;
  if (error?.status === 409 || error?.code === "PRACTICE_STALE_SESSION_VERSION") return messages.conflict;
  if (error?.status === 410 || error?.code === "PRACTICE_SESSION_EXPIRED") return messages.expired;
  return error?.message || messages.fallback;
}
