"use client";

import type { RefObject } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { formatChatText } from "./chat-format";
import { quotaBadge } from "./chat-quota";
import { CHAT_SHORTCUT_ARIA, CHAT_SHORTCUT_LABEL } from "./chat-shortcut";
import type { ChatQuota } from "./contracts";

interface ChatToggleButtonProps {
  open: boolean;
  quota: ChatQuota | null;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}

export function ChatToggleButton({ open, quota, buttonRef, onClick }: ChatToggleButtonProps) {
  const { t } = useTranslation();
  const badge = quotaBadge(quota);
  const label = open ? t("chat.toggleClose") : t("chat.toggleOpen");
  return (
    <button
      ref={buttonRef}
      type="button"
      className="chat-toggle"
      data-open={open}
      aria-expanded={open}
      aria-keyshortcuts={CHAT_SHORTCUT_ARIA}
      aria-label={badge && !open ? `${label}. ${formatChatText(t("chat.badgeLabel"), { remaining: badge.text })}` : label}
      title={`${label} (${CHAT_SHORTCUT_LABEL})`}
      onClick={onClick}
    >
      <AppIcon name="sparkle" size={18} />
      <span className="chat-toggle-label">{t("chat.title")}</span>
      {badge ? <span className="chat-toggle-badge" data-low={badge.low} aria-hidden="true">{badge.text}</span> : null}
    </button>
  );
}
