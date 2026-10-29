"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { ChatApi } from "./api";
import { ChatComposer } from "./ChatComposer";
import { ChatConsentGate } from "./ChatConsentGate";
import { ChatMessageList } from "./ChatMessageList";
import { ChatQuotaNotice } from "./ChatQuotaNotice";
import { consentBlocksChat } from "./chat-consent";
import { trapTarget } from "./chat-focus-trap";
import { isQuotaExhausted } from "./chat-quota";
import type { ChatQuota } from "./contracts";
import { useChatConsent } from "./useChatConsent";
import { useChatSession } from "./useChatSession";

const FOCUSABLE = 'button:not(:disabled), textarea:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface ChatPanelProps {
  api: ChatApi;
  quota: ChatQuota | null;
  setQuota: (quota: ChatQuota) => void;
  refreshQuota: () => Promise<void>;
  open: boolean;
  /** On a narrow screen the panel covers the page, so it behaves as a dialog: focus stays inside and the page cannot scroll. */
  modal: boolean;
  /** Task being practised, already checked against the server whitelist; null when unknown. */
  taskType: string | null;
  onClose: () => void;
}

export function ChatPanel({ api, quota, setQuota, refreshQuota, open, modal, taskType, onClose }: ChatPanelProps) {
  const { t, locale } = useTranslation();
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { state, load, send, setDraft, startNewChat, dismissError } = useChatSession({
    api,
    taskType,
    language: locale,
    onQuota: setQuota,
  });
  const isDialog = modal && open;
  const consent = useChatConsent(api);
  const { load: loadConsent, markRequired } = consent;
  const blocked = consentBlocksChat(consent.state.status);

  // The conversation loads once; the quota is re-read every time the panel is shown again.
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (open) void refreshQuota();
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

  useEffect(() => {
    if (!isDialog) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDialog]);

  const retryLoad = () => {
    dismissError();
    void load();
  };

  const pickSuggestion = (text: string) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab" || !isDialog || !panelRef.current) return;
    const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const target = trapTarget({
      activeIndex: controls.indexOf(document.activeElement as HTMLElement),
      count: controls.length,
      shiftKey: event.shiftKey,
    });
    if (target !== null) {
      event.preventDefault();
      controls[target].focus();
    }
  };

  return (
    <aside
      ref={panelRef}
      className="chat-panel"
      hidden={!open}
      role={isDialog ? "dialog" : undefined}
      aria-modal={isDialog ? true : undefined}
      aria-label={t("chat.title")}
      onKeyDown={handleKeyDown}
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
    </aside>
  );
}
