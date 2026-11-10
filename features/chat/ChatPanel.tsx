"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactElement } from "react";
import { Button } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { ChatApi } from "./api";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatQuotaNotice } from "./ChatQuotaNotice";
import { isQuotaExhausted } from "./chat-quota";
import type { ChatQuota } from "./contracts";
import { useChatSession } from "./useChatSession";
import type { ChatErrorKey } from "./chat-errors";
import { useChatDrag } from "./useChatDrag";
import { ChatHeader } from "./ChatHeader";
import { useAssistantName } from "./useAssistantName";
import { useChatResize } from "./useChatResize";

const QUOTA_REUSE_MS = 10_000;

interface ChatPanelProps {
  api: ChatApi;
  quota: ChatQuota | null;
  setQuota: (quota: ChatQuota) => void;
  refreshQuota: (maxAgeMs?: number) => Promise<void>;
  unavailable?: boolean;
  availabilityError?: ChatErrorKey | null;
  open: boolean;
  /** Task being practised, already checked against the server whitelist; null when unknown. */
  taskType: string | null;
  /** Text of the exercise on screen, sent as context with each question; null when there is none. */
  exercisePrompt: string | null;
  onClose: () => void;
}

export function ChatPanel({ api, quota, setQuota, refreshQuota, unavailable = false, availabilityError = null,
  open, taskType, exercisePrompt, onClose }: ChatPanelProps): ReactElement {
  const { t, locale } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const drag = useChatDrag(panelRef, open);
  const resize = useChatResize(panelRef, open);
  const name = useAssistantName() ?? t("chat.title");
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
    if (open && !state.pending) {
      if (panelRef.current?.querySelector(".assistant-name-editor:focus-within")) return;
      if (unavailable) panelRef.current?.focus();
      else inputRef.current?.focus();
    }
  }, [open, state.pending, unavailable]);

  const sendAnswer = () => {
    if (!unavailable) void send();
  };

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
      ref={panelRef}
      tabIndex={-1}
      hidden={!open}
      aria-label={name}
      onKeyDown={handleKeyDown}
    >
      <ChatHeader drag={drag} pending={state.pending} onNewChat={startNewChat} onClose={onClose} />
      <ChatMessageList
        messages={state.messages}
        pendingQuestion={state.pendingQuestion}
        suggestionsEnabled={!unavailable && !isQuotaExhausted(quota)}
        onPickSuggestion={pickSuggestion}
      />
      {availabilityError ? (
        <div className="chat-notice" data-kind="error" role="alert">
          <p>{t(`chat.errors.${availabilityError}`)}</p>
          <Button variant="secondary" size="sm" onClick={() => void refreshQuota()}>{t("common.tryAgain")}</Button>
        </div>
      ) : state.errorKey ? (
        <div className="chat-notice" data-kind="error" role="alert">
          <p>{t(`chat.errors.${state.errorKey}`)}</p>
        </div>
      ) : null}
      <ChatQuotaNotice quota={quota} onExpired={refreshQuota} />
      <ChatComposer
        draft={state.draft}
        pending={state.pending}
        blocked={unavailable}
        quota={quota}
        inputRef={inputRef}
        onDraftChange={setDraft}
        onSubmit={sendAnswer}
      />
      <p className="chat-disclaimer" title={t("chat.disclaimer")}>{t("chat.disclaimerShort")}</p>
      <button type="button" className="chat-resize-handle" {...resize}
        aria-label={t("chat.resizeHint")} title={t("chat.resizeHint")}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m5 13 8-8M10 13l3-3" />
        </svg>
      </button>
    </aside>
  );
}
