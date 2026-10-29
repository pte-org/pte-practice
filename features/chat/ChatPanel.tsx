"use client";

import { useEffect, useMemo, useRef } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { createChatApi } from "./api";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatQuotaNotice } from "./ChatQuotaNotice";
import { useChatQuota } from "./useChatQuota";
import { useChatSession } from "./useChatSession";

interface ChatPanelProps {
  open: boolean;
  /** Task being practised, already checked against the server whitelist; null when unknown. */
  taskType: string | null;
  onClose: () => void;
}

export function ChatPanel({ open, taskType, onClose }: ChatPanelProps) {
  const { t, locale } = useTranslation();
  const api = useMemo(() => createChatApi(), []);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { quota, setQuota, refresh } = useChatQuota(api);
  const { state, load, send, setDraft, startNewChat, dismissError } = useChatSession({
    api,
    taskType,
    language: locale,
    onQuota: setQuota,
  });

  // The conversation loads once; the quota is re-read every time the panel is shown again.
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  // Keyboard users keep their place: focus the input when the panel opens and again after each answer.
  useEffect(() => {
    if (open && state.loaded && !state.pending) inputRef.current?.focus();
  }, [open, state.loaded, state.pending]);

  const retryLoad = () => {
    dismissError();
    void load();
  };

  return (
    <aside
      className="chat-panel"
      hidden={!open}
      aria-label={t("chat.title")}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <header className="chat-header">
        <h2 className="chat-title">{t("chat.title")}</h2>
        <button type="button" className="chat-header-button" onClick={startNewChat} disabled={state.pending || !state.loaded}>
          <AppIcon name="edit" size={16} />
          {t("chat.newChat")}
        </button>
        <button type="button" className="chat-header-button" onClick={onClose} aria-label={t("chat.toggleClose")}>
          <AppIcon name="close" size={16} />
        </button>
      </header>
      <ChatMessageList messages={state.messages} pendingQuestion={state.pendingQuestion} />
      {state.errorKey ? (
        <div className="chat-notice" data-kind="error" role="alert">
          <p>{t(`chat.errors.${state.errorKey}`)}</p>
          {!state.loaded ? (
            <button type="button" className="chat-header-button" onClick={retryLoad}>{t("common.tryAgain")}</button>
          ) : null}
        </div>
      ) : null}
      <ChatQuotaNotice quota={quota} onExpired={refresh} />
      <ChatComposer
        draft={state.draft}
        pending={state.pending}
        ready={state.loaded}
        quota={quota}
        inputRef={inputRef}
        onDraftChange={setDraft}
        onSubmit={() => void send()}
      />
      <p className="chat-disclaimer">{t("chat.disclaimer")}</p>
    </aside>
  );
}
