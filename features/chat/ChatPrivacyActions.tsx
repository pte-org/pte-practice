"use client";

import { useReducer } from "react";
import { useTranslation } from "@/common/i18n";
import type { ChatApi } from "./api";
import { chatErrorKey } from "./chat-errors";
import { chatPrivacyReducer, INITIAL_PRIVACY_STATE, type ChatPrivacyAction } from "./chat-privacy";

interface ChatPrivacyActionsProps {
  api: ChatApi;
  /** The consent is gone: the panel goes back to the privacy notice. */
  onWithdrawn: () => void;
  /** The history is gone: the panel starts an empty conversation. */
  onDeleted: () => void;
}

/** A small "data settings" menu under the disclaimer holding two actions; each asks once more before it acts, because neither can be undone. */
export function ChatPrivacyActions({ api, onWithdrawn, onDeleted }: ChatPrivacyActionsProps) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(chatPrivacyReducer, INITIAL_PRIVACY_STATE);

  const run = async (action: ChatPrivacyAction) => {
    dispatch({ type: "started" });
    try {
      if (action === "withdraw") await api.withdrawConsent();
      else await api.deleteHistory();
      dispatch({ type: "succeeded" });
      if (action === "withdraw") onWithdrawn();
      else onDeleted();
    } catch (error) {
      dispatch({ type: "failed", errorKey: chatErrorKey(error) });
    }
  };

  if (state.confirming) {
    const action = state.confirming;
    return (
      <div className="chat-privacy" role="group">
        <p>{t(action === "withdraw" ? "chat.privacy.confirmWithdraw" : "chat.privacy.confirmDelete")}</p>
        {state.errorKey ? <p role="alert">{t(`chat.errors.${state.errorKey}`)}</p> : null}
        <div className="chat-privacy-buttons">
          <button type="button" className="chat-header-button" disabled={state.pending} onClick={() => void run(action)}>
            {t("chat.privacy.confirm")}
          </button>
          <button type="button" className="chat-header-button" disabled={state.pending} onClick={() => dispatch({ type: "cancel" })}>
            {t("chat.privacy.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-footer">
      <details className="chat-menu">
        <summary>{t("chat.dataSettings")}</summary>
        <div className="chat-menu-list">
          <button type="button" className="chat-privacy-link" onClick={() => dispatch({ type: "ask", action: "withdraw" })}>
            {t("chat.privacy.withdraw")}
          </button>
          <button type="button" className="chat-privacy-link" onClick={() => dispatch({ type: "ask", action: "delete" })}>
            {t("chat.privacy.delete")}
          </button>
        </div>
      </details>
    </div>
  );
}
