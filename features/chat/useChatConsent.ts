"use client";

import { useCallback, useReducer } from "react";
import type { ChatApi } from "./api";
import { chatConsentReducer, INITIAL_CONSENT_STATE } from "./chat-consent";
import { chatErrorKey } from "./chat-errors";
import { CHAT_CONSENT_POLICY_VERSION } from "./constants";

/** Whether this student has accepted the current privacy notice. The server decides; this only mirrors it. */
export function useChatConsent(api: ChatApi) {
  const [state, dispatch] = useReducer(chatConsentReducer, INITIAL_CONSENT_STATE);

  const load = useCallback(async () => {
    try {
      dispatch({ type: "loaded", consent: await api.getConsent() });
    } catch (error) {
      dispatch({ type: "loadFailed", errorKey: chatErrorKey(error) });
    }
  }, [api]);

  const accept = useCallback(async () => {
    dispatch({ type: "acceptStarted" });
    try {
      await api.acceptConsent(CHAT_CONSENT_POLICY_VERSION);
      dispatch({ type: "acceptSucceeded" });
    } catch (error) {
      dispatch({ type: "acceptFailed", errorKey: chatErrorKey(error) });
    }
  }, [api]);

  const setAgeChecked = useCallback((checked: boolean) => dispatch({ type: "ageToggled", checked }), []);
  const markRequired = useCallback(() => dispatch({ type: "required" }), []);

  return { state, load, accept, setAgeChecked, markRequired };
}
