/** A daily limit is in force: the server reports what is left and when the count resets. */
export interface LimitedChatQuota {
  used: number;
  remaining: number;
  limit: number;
  /** ISO-8601 instant at which the daily count resets. */
  resetAt: string;
  unlimited: false;
}

/** The deployment set no daily limit (CHAT_AI_DAILY_LIMIT=0): questions are counted but never refused. */
export interface UnlimitedChatQuota {
  used: number;
  remaining: null;
  limit: null;
  resetAt: null;
  unlimited: true;
}

export type ChatQuota = LimitedChatQuota | UnlimitedChatQuota;

/** One earlier turn of the conversation, sent back with the next question; the server stores none of it. */
export interface ChatHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

export type ChatReply =
  | { markdown: string; onTopic: boolean; remaining: number; limit: number; resetAt: string; unlimited: false }
  | { markdown: string; onTopic: boolean; remaining: null; limit: null; resetAt: null; unlimited: true };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function normalizeChatQuota(value: unknown): ChatQuota | null {
  const record = asRecord(value);
  if (!record) return null;
  const { used, remaining, limit, resetAt, unlimited } = record;
  if (!isCount(used)) return null;
  // An older server sends no `unlimited`; it always has a limit.
  if (unlimited === true) return { used, remaining: null, limit: null, resetAt: null, unlimited: true };
  if (!isCount(remaining) || !isCount(limit) || !isDateString(resetAt)) return null;
  return { used, remaining, limit, resetAt, unlimited: false };
}

export function normalizeChatReply(value: unknown): ChatReply | null {
  const record = asRecord(value);
  if (!record) return null;
  const { markdown, onTopic, remaining, limit, resetAt, unlimited } = record;
  if (typeof markdown !== "string" || typeof onTopic !== "boolean") return null;
  if (unlimited === true) return { markdown, onTopic, remaining: null, limit: null, resetAt: null, unlimited: true };
  if (!isCount(remaining) || !isCount(limit) || !isDateString(resetAt)) return null;
  return { markdown, onTopic, remaining, limit, resetAt, unlimited: false };
}
