"use client";

import { useEffect } from "react";
import { useTranslation } from "@/common/i18n";
import { formatChatText } from "./chat-format";
import { quotaNoticeKind, timeUntilReset } from "./chat-quota";
import type { ChatQuota } from "./contracts";
import { useNow } from "./useNow";

const COUNTDOWN_REFRESH_MS = 30_000;

interface ChatQuotaNoticeProps {
  quota: ChatQuota | null;
  /** Called once when the countdown passes the reset time, so the panel can re-read the server's quota. */
  onExpired: () => void;
}

/** Quiet "x left" line normally, a warning at three or fewer, and a lock message with the reset time at zero. */
export function ChatQuotaNotice({ quota, onExpired }: ChatQuotaNoticeProps) {
  const { t } = useTranslation();
  const now = useNow(COUNTDOWN_REFRESH_MS);
  const expired = quota !== null && Date.parse(quota.resetAt) <= now.getTime();
  useEffect(() => {
    if (expired) onExpired();
  }, [expired, onExpired]);
  if (!quota) return null;

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
