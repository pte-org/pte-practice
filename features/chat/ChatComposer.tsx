"use client";

import type { KeyboardEvent, RefObject, ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import { Button } from "@/common/components";
import { formatChatText } from "./chat-format";
import { remainingInputChars } from "./chat-input";
import { chatComposerState } from "./chat-state";
import { CHAT_MAX_INPUT_CHARS } from "./constants";
import type { ChatQuota } from "./contracts";
import { useAssistantName } from "./useAssistantName";

interface ChatComposerProps {
  draft: string;
  pending: boolean;
  blocked?: boolean;
  quota: ChatQuota | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (text: string) => void;
  onSubmit: () => void;
}

/** Locked while an answer is on its way and when the day's quota is used up; Enter sends, Shift+Enter breaks the line. */
export function ChatComposer({ draft, pending, blocked = false, quota, inputRef, onDraftChange, onSubmit }: ChatComposerProps): ReactElement {
  const { t } = useTranslation();
  const customName = useAssistantName();
  const placeholder = customName ? formatChatText(t("chat.namedPlaceholder"), { name: customName }) : t("chat.placeholder");
  const { disabled: composerDisabled, reason } = chatComposerState({ quota, pending, draft });
  const disabled = blocked || composerDisabled;
  const inputLocked = blocked || pending || reason === "exhausted";
  const overLimit = remainingInputChars(draft) < 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!disabled) onSubmit();
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
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={inputLocked}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button size="sm" iconOnly className="chat-send" disabled={disabled} onClick={onSubmit} aria-label={t("chat.send")} title={t("chat.send")}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </Button>
      </div>
      {draft.length > 0 ? <p className="chat-counter" data-over={overLimit}>
        {overLimit
          ? formatChatText(t("chat.tooLong"), { limit: CHAT_MAX_INPUT_CHARS })
          : formatChatText(t("chat.charCount"), { count: draft.length, limit: CHAT_MAX_INPUT_CHARS })}
      </p> : null}
    </div>
  );
}
