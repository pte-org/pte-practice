"use client";

import type { KeyboardEvent, RefObject } from "react";
import { useTranslation } from "@/common/i18n";
import { formatChatText } from "./chat-format";
import { remainingInputChars } from "./chat-input";
import { chatComposerState } from "./chat-state";
import { CHAT_MAX_INPUT_CHARS } from "./constants";
import type { ChatQuota } from "./contracts";

interface ChatComposerProps {
  draft: string;
  pending: boolean;
  ready: boolean;
  quota: ChatQuota | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (text: string) => void;
  onSubmit: () => void;
}

/** Locked while an answer is on its way and when the day's quota is used up; Enter sends, Shift+Enter breaks the line. */
export function ChatComposer({ draft, pending, ready, quota, inputRef, onDraftChange, onSubmit }: ChatComposerProps) {
  const { t } = useTranslation();
  const { disabled, reason } = chatComposerState({ quota, pending, draft });
  const inputLocked = pending || reason === "exhausted";
  const overLimit = remainingInputChars(draft) < 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!disabled && ready) onSubmit();
    }
  };

  return (
    <div className="chat-composer">
      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          value={draft}
          placeholder={t("chat.placeholder")}
          aria-label={t("chat.placeholder")}
          disabled={inputLocked || !ready}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="chat-send" disabled={disabled || !ready} onClick={onSubmit} aria-label={t("chat.send")} title={t("chat.send")}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
      <p className="chat-counter" data-over={overLimit}>
        {overLimit
          ? formatChatText(t("chat.tooLong"), { limit: CHAT_MAX_INPUT_CHARS })
          : formatChatText(t("chat.charCount"), { count: draft.length, limit: CHAT_MAX_INPUT_CHARS })}
      </p>
    </div>
  );
}
