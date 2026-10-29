"use client";

import type { RefObject } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";

interface ChatToggleButtonProps {
  open: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}

export function ChatToggleButton({ open, buttonRef, onClick }: ChatToggleButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      ref={buttonRef}
      type="button"
      className="chat-toggle"
      data-open={open}
      aria-expanded={open}
      aria-label={open ? t("chat.toggleClose") : t("chat.toggleOpen")}
      onClick={onClick}
    >
      <AppIcon name="sparkle" size={18} />
      {t("chat.title")}
    </button>
  );
}
