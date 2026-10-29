"use client";

import { useTranslation } from "@/common/i18n";
import { canAcceptConsent, type ChatConsentState } from "./chat-consent";

interface ChatConsentGateProps {
  state: ChatConsentState;
  onAgeChange: (checked: boolean) => void;
  onAccept: () => void;
  onRetry: () => void;
}

/** Shown instead of the conversation until the student accepts the privacy notice, or when that cannot be checked. */
export function ChatConsentGate({ state, onAgeChange, onAccept, onRetry }: ChatConsentGateProps) {
  const { t } = useTranslation();
  if (state.status === "loading") return <div className="chat-consent" aria-busy="true" />;

  const error = state.errorKey ? (
    <p className="chat-notice" data-kind="error" role="alert">{t(`chat.errors.${state.errorKey}`)}</p>
  ) : null;

  if (state.status === "failed") {
    return (
      <div className="chat-consent">
        {error}
        <button type="button" className="chat-header-button" onClick={onRetry}>{t("chat.consent.retry")}</button>
      </div>
    );
  }

  return (
    <div className="chat-consent">
      <h3 className="chat-consent-title">{t("chat.consent.title")}</h3>
      <ul className="chat-consent-points">
        <li>{t("chat.consent.point1")}</li>
        <li>{t("chat.consent.point2")}</li>
        <li>{t("chat.consent.point3")}</li>
      </ul>
      <label className="chat-consent-age">
        <input
          type="checkbox"
          checked={state.ageChecked}
          disabled={state.pending}
          onChange={(event) => onAgeChange(event.target.checked)}
        />
        <span>{t("chat.consent.ageLabel")}</span>
      </label>
      {error}
      <button type="button" className="chat-send" disabled={!canAcceptConsent(state)} onClick={onAccept}>
        {t("chat.consent.accept")}
      </button>
    </div>
  );
}
