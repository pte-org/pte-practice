import { PracticeApiError } from "@/features/practice/api";
import { CHAT_ERROR_CODES, CHAT_WARNING_THRESHOLD } from "./constants";
import type { ChatQuota, ChatReply } from "./contracts";

export type ChatQuotaNoticeKind = "none" | "warning" | "exhausted";

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

/** The one place the panel learns that no daily limit is in force. */
export function isQuotaUnlimited(quota: ChatQuota | null): boolean {
  return quota?.unlimited === true;
}

export function isQuotaExhausted(quota: ChatQuota | null): boolean {
  return quota !== null && !quota.unlimited && quota.remaining <= 0;
}

export function quotaNoticeKind(quota: ChatQuota | null): ChatQuotaNoticeKind {
  if (!quota || quota.unlimited) return "none";
  if (quota.remaining <= 0) return "exhausted";
  return quota.remaining <= CHAT_WARNING_THRESHOLD ? "warning" : "none";
}

/** The small count on the closed toggle; `low` uses the same threshold as the warning notice. */
export function quotaBadge(quota: ChatQuota | null): { text: string; low: boolean } | null {
  if (!quota || quota.unlimited) return null;
  const remaining = Math.max(0, quota.remaining);
  return { text: String(remaining), low: remaining <= CHAT_WARNING_THRESHOLD };
}

/** Whether a quota read at `fetchedAtMs` is recent enough to reuse; a `maxAgeMs` of 0 always asks the server. */
export function isQuotaFresh(fetchedAtMs: number | null, nowMs: number, maxAgeMs: number): boolean {
  if (fetchedAtMs === null || maxAgeMs <= 0) return false;
  const age = nowMs - fetchedAtMs;
  return age >= 0 && age < maxAgeMs;
}

/** True once the clock passes the reset time, whether or not the server has caught up with a fresh quota. */
export function isQuotaResetDue(quota: ChatQuota | null, now: Date): boolean {
  if (!quota || quota.unlimited) return false;
  const resetMs = Date.parse(quota.resetAt);
  return !Number.isNaN(resetMs) && resetMs <= now.getTime();
}

/** Whole minutes rounded up, so "reset in 0m" is never shown while the quota is still locked. */
export function timeUntilReset(resetAt: string, now: Date): { hours: number; minutes: number } {
  const resetMs = Date.parse(resetAt);
  if (Number.isNaN(resetMs)) return { hours: 0, minutes: 0 };
  const totalMinutes = Math.max(0, Math.ceil((resetMs - now.getTime()) / MS_PER_MINUTE));
  return { hours: Math.floor(totalMinutes / MINUTES_PER_HOUR), minutes: totalMinutes % MINUTES_PER_HOUR };
}

/** The 429 body carries the reset time and limit, so the panel can lock itself without another request. */
export function quotaFromError(error: unknown): ChatQuota | null {
  if (!(error instanceof PracticeApiError) || error.code !== CHAT_ERROR_CODES.quotaExceeded) return null;
  const data = error.data;
  if (typeof data !== "object" || data === null) return null;
  const { limit, resetAt } = data as Record<string, unknown>;
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0) return null;
  if (typeof resetAt !== "string" || Number.isNaN(Date.parse(resetAt))) return null;
  return { used: limit, remaining: 0, limit, resetAt, unlimited: false };
}

/** The quota a reply reports. A reply carries no count of today's questions; nothing shows it when unlimited. */
export function quotaFromReply(reply: ChatReply): ChatQuota {
  if (reply.unlimited) return { used: 0, remaining: null, limit: null, resetAt: null, unlimited: true };
  return {
    used: reply.limit - reply.remaining,
    remaining: reply.remaining,
    limit: reply.limit,
    resetAt: reply.resetAt,
    unlimited: false,
  };
}
