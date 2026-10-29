export interface ChatQuota {
  used: number;
  remaining: number;
  limit: number;
  /** ISO-8601 instant at which the daily count resets. */
  resetAt: string;
}

export type ChatHistoryStatus = "OK" | "REFUSED" | "FAILED";

export interface ChatHistoryItem {
  question: string;
  answer: string;
  status: ChatHistoryStatus;
  createdAt: string;
}

export interface ChatLatestSession {
  sessionId: string | null;
  messages: ChatHistoryItem[];
}

export interface ChatReply {
  markdown: string;
  onTopic: boolean;
  fromCache: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  sessionId: string;
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

function isHistoryStatus(value: unknown): value is ChatHistoryStatus {
  return value === "OK" || value === "REFUSED" || value === "FAILED";
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
  const { markdown, onTopic, fromCache, remaining, limit, resetAt, sessionId } = record;
  if (
    typeof markdown !== "string" || typeof onTopic !== "boolean" || typeof fromCache !== "boolean"
    || !isCount(remaining) || !isCount(limit) || !isDateString(resetAt)
    || typeof sessionId !== "string" || !sessionId
  ) {
    return null;
  }
  return { markdown, onTopic, fromCache, remaining, limit, resetAt, sessionId };
}

function normalizeHistoryItem(value: unknown): ChatHistoryItem | null {
  const record = asRecord(value);
  if (!record) return null;
  const { question, answer, status, createdAt } = record;
  if (
    typeof question !== "string" || typeof answer !== "string" || typeof createdAt !== "string"
    || !isHistoryStatus(status)
  ) {
    return null;
  }
  return { question, answer, status, createdAt };
}

export interface ChatConsent {
  policyVersion: string;
  consented: boolean;
  consentedAt: string | null;
}

export function normalizeChatConsent(value: unknown): ChatConsent | null {
  const record = asRecord(value);
  if (!record) return null;
  const { policyVersion, consented, consentedAt } = record;
  if (typeof policyVersion !== "string" || policyVersion === "" || typeof consented !== "boolean") return null;
  return { policyVersion, consented, consentedAt: isDateString(consentedAt) ? consentedAt : null };
}

export function normalizeLatestSession(value: unknown): ChatLatestSession | null {
  const record = asRecord(value);
  if (!record) return null;
  const { sessionId, messages } = record;
  if (sessionId !== null && typeof sessionId !== "string") return null;
  const items = Array.isArray(messages)
    ? messages.map(normalizeHistoryItem).filter((item): item is ChatHistoryItem => item !== null)
    : [];
  return { sessionId, messages: items };
}
