"use client";

import { useEffect } from "react";
import { useTranslation } from "@/common/i18n";
import { formatChatText } from "./chat-format";
import { isQuotaResetDue, quotaNoticeKind, timeUntilReset } from "./chat-quota";
import type { ChatQuota } from "./contracts";
import { useNow } from "./useNow";

const COUNTDOWN_REFRESH_MS = 30_000;

interface ChatQuotaNoticeProps {
  quota: ChatQuota | null;
  /** Called when the clock passes the reset time, and again on every tick until the server reports a later one. */
  onExpired: () => void;
}

/** Quiet "x left" line normally, a warning at three or fewer, and a lock message with the reset time at zero. */
export function ChatQuotaNotice({ quota, onExpired }: ChatQuotaNoticeProps) {
  const { t } = useTranslation();
  const now = useNow(COUNTDOWN_REFRESH_MS);
  const resetDue = isQuotaResetDue(quota, now);
  // Not keyed on `resetDue` alone: a student's clock can run ahead of the server's, so the first re-read may
  // still return the old reset time. Asking again each tick keeps the panel from sticking at "0h 0m".
  useEffect(() => {
    if (resetDue) onExpired();
  }, [resetDue, now, onExpired]);
  if (!quota) return null;
  if (resetDue) {
    return <p className="chat-notice-quota" role="status">{t("chat.quotaRefreshing")}</p>;
  }

  const kind = quotaNoticeKind(quota);
  const values = { remaining: quota.remaining, limit: quota.limit, ...timeUntilReset(quota.resetAt, now) };
  if (kind === "none") {
    return <p className="chat-notice-quota">{formatChatText(t("chat.quotaLeft"), values)}</p>;
  }
  const message = kind === "exhausted" ? t("chat.quotaExhausted") : t("chat.quotaWarning");
  return (
    <p className="chat-notice" data-kind={kind} role="status">
      {formatChatText(message, values)} {formatChatText(t("chat.resetIn"), values)}
    </p>
  );
}
