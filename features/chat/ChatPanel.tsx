"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { ChatApi } from "./api";
import { ChatComposer } from "./ChatComposer";
import { ChatConsentGate } from "./ChatConsentGate";
import { ChatMessageList } from "./ChatMessageList";
import { ChatPrivacyActions } from "./ChatPrivacyActions";
import { ChatQuotaNotice } from "./ChatQuotaNotice";
import { consentBlocksChat } from "./chat-consent";
import { isQuotaExhausted } from "./chat-quota";
import type { ChatQuota } from "./contracts";
import { useChatConsent } from "./useChatConsent";
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
  const { state, load, send, setDraft, startNewChat, dismissError } = useChatSession({
    api,
    taskType,
    exercisePrompt,
    language: locale,
    onQuota: setQuota,
  });
  const consent = useChatConsent(api);
  const { load: loadConsent, markRequired } = consent;
  const blocked = consentBlocksChat(consent.state.status);

  // The conversation loads once; the quota is re-read every time the panel is shown again.
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    // The layout read the quota when the page opened; do not ask again for a few seconds after that.
    if (open) void refreshQuota(QUOTA_REUSE_MS);
  }, [open, refreshQuota]);
  useEffect(() => {
    void loadConsent();
  }, [loadConsent]);
  // A send refused for missing consent (the notice changed since the student accepted) goes back to the notice.
  useEffect(() => {
    if (state.errorKey === "consentRequired") {
      markRequired();
      dismissError();
    }
  }, [state.errorKey, markRequired, dismissError]);

  // Keyboard users keep their place: focus the input when the panel opens and again after each answer.
  useEffect(() => {
    if (open && state.loaded && !state.pending) inputRef.current?.focus();
  }, [open, state.loaded, state.pending]);

  const retryLoad = () => {
    dismissError();
    void load();
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
          disabled={state.pending || !state.loaded}
          aria-label={t("chat.newChat")}
          title={t("chat.newChat")}
        >
          <AppIcon name="edit" size={18} />
        </button>
        <button type="button" className="chat-icon-button" onClick={onClose} aria-label={t("chat.toggleClose")} title={t("chat.toggleClose")}>
          <AppIcon name="close" size={18} />
        </button>
      </header>
      {blocked ? (
        <ChatConsentGate
          state={consent.state}
          onAgeChange={consent.setAgeChecked}
          onAccept={() => void consent.accept()}
          onRetry={() => void consent.load()}
        />
      ) : (
        <>
          <ChatMessageList
            messages={state.messages}
            pendingQuestion={state.pendingQuestion}
            suggestionsEnabled={state.loaded && !isQuotaExhausted(quota)}
            onPickSuggestion={pickSuggestion}
          />
          {state.errorKey ? (
            <div className="chat-notice" data-kind="error" role="alert">
              <p>{t(`chat.errors.${state.errorKey}`)}</p>
              {!state.loaded ? (
                <button type="button" className="chat-header-button" onClick={retryLoad}>{t("common.tryAgain")}</button>
              ) : null}
            </div>
          ) : null}
          <ChatQuotaNotice quota={quota} onExpired={refreshQuota} />
          <ChatComposer
            draft={state.draft}
            pending={state.pending}
            ready={state.loaded}
            quota={quota}
            inputRef={inputRef}
            onDraftChange={setDraft}
            onSubmit={() => void send()}
          />
        </>
      )}
      <p className="chat-disclaimer">{t("chat.disclaimer")}</p>
      {blocked ? null : <ChatPrivacyActions api={api} onWithdrawn={markRequired} onDeleted={startNewChat} />}
    </aside>
  );
}
