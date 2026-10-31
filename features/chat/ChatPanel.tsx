"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { ChatApi } from "./api";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatQuotaNotice } from "./ChatQuotaNotice";
import { isQuotaExhausted } from "./chat-quota";
import type { ChatQuota } from "./contracts";
import { useChatSession } from "./useChatSession";

const QUOTA_REUSE_MS = 10_000;

interface ChatPanelProps {
  api: ChatApi;
  quota: ChatQuota | null;
  setQuota: (quota: ChatQuota) => void;
  refreshQuota: (maxAgeMs?: number) => Promise<void>;
  open: boolean;
  /** Task being practised, already checked against the server whitelist; null when unknown. */
  taskType: string | null;
  /** Text of the exercise on screen, sent as context with each question; null when there is none. */
  exercisePrompt: string | null;
  onClose: () => void;
}

export function ChatPanel({ api, quota, setQuota, refreshQuota, open, taskType, exercisePrompt, onClose }: ChatPanelProps) {
  const { t, locale } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { state, send, setDraft, startNewChat } = useChatSession({
    api,
    taskType,
    exercisePrompt,
    language: locale,
    onQuota: setQuota,
  });

  useEffect(() => {
    // The layout read the quota when the page opened; do not ask again for a few seconds after that.
    if (open) void refreshQuota(QUOTA_REUSE_MS);
  }, [open, refreshQuota]);

  // Keyboard users keep their place: focus the input when the panel opens and again after each answer.
  useEffect(() => {
    if (open && !state.pending) inputRef.current?.focus();
  }, [open, state.pending]);

  const pickSuggestion = (text: string) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  // The box floats over the exercise and is not a dialog: the page stays usable, so Tab may leave it. Esc closes it.
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") onClose();
  };

  return (
    <aside
      className="chat-panel"
      hidden={!open}
      aria-label={t("chat.title")}
      onKeyDown={handleKeyDown}
    >
      <header className="chat-header">
        <span className="chat-avatar" aria-hidden="true"><AppIcon name="sparkle" size={18} /></span>
        <div className="chat-heading">
          <h2 className="chat-title">{t("chat.title")}</h2>
          <p className="chat-subtitle">{t("chat.subtitle")}</p>
        </div>
        <button
          type="button"
          className="chat-icon-button"
          onClick={startNewChat}
          disabled={state.pending}
          aria-label={t("chat.newChat")}
          title={t("chat.newChat")}
        >
          <AppIcon name="edit" size={18} />
        </button>
        <button type="button" className="chat-icon-button" onClick={onClose} aria-label={t("chat.toggleClose")} title={t("chat.toggleClose")}>
          <AppIcon name="close" size={18} />
        </button>
      </header>
      <ChatMessageList
        messages={state.messages}
        pendingQuestion={state.pendingQuestion}
        suggestionsEnabled={!isQuotaExhausted(quota)}
        onPickSuggestion={pickSuggestion}
      />
      {state.errorKey ? (
        <div className="chat-notice" data-kind="error" role="alert">
          <p>{t(`chat.errors.${state.errorKey}`)}</p>
        </div>
      ) : null}
      <ChatQuotaNotice quota={quota} onExpired={refreshQuota} />
      <ChatComposer
        draft={state.draft}
        pending={state.pending}
        quota={quota}
        inputRef={inputRef}
        onDraftChange={setDraft}
        onSubmit={() => void send()}
      />
      <p className="chat-disclaimer">{t("chat.disclaimer")}</p>
    </aside>
  );
}
