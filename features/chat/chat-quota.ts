import { PracticeApiError } from "@/features/practice/api";
import { CHAT_ERROR_CODES, CHAT_WARNING_THRESHOLD } from "./constants";
import type { ChatQuota } from "./contracts";

export type ChatQuotaNoticeKind = "none" | "warning" | "exhausted";

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

export function isQuotaExhausted(quota: ChatQuota | null): boolean {
  return quota !== null && quota.remaining <= 0;
}

export function quotaNoticeKind(quota: ChatQuota | null): ChatQuotaNoticeKind {
  if (!quota) return "none";
  if (quota.remaining <= 0) return "exhausted";
  return quota.remaining <= CHAT_WARNING_THRESHOLD ? "warning" : "none";
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
  return { used: limit, remaining: 0, limit, resetAt };
}
