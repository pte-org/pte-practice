export interface ChatQuota {
  used: number;
  remaining: number;
  limit: number;
  /** ISO-8601 instant at which the daily count resets. */
  resetAt: string;
}

/** One earlier turn of the conversation, sent back with the next question; the server stores none of it. */
export interface ChatHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

export interface ChatReply {
  markdown: string;
  onTopic: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

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
  const { used, remaining, limit, resetAt } = record;
  if (!isCount(used) || !isCount(remaining) || !isCount(limit) || !isDateString(resetAt)) return null;
  return { used, remaining, limit, resetAt };
}

export function normalizeChatReply(value: unknown): ChatReply | null {
  const record = asRecord(value);
  if (!record) return null;
  const { markdown, onTopic, remaining, limit, resetAt } = record;
  if (
    typeof markdown !== "string" || typeof onTopic !== "boolean"
    || !isCount(remaining) || !isCount(limit) || !isDateString(resetAt)
  ) {
    return null;
  }
  return { markdown, onTopic, remaining, limit, resetAt };
}
