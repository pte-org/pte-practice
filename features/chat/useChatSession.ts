"use client";

import { useCallback, useReducer } from "react";
import type { ChatApi } from "./api";
import { chatErrorKey } from "./chat-errors";
import { validateChatInput } from "./chat-input";
import { quotaFromError } from "./chat-quota";
import { createChatSessionId } from "./chat-session-id";
import { chatReducer, INITIAL_CHAT_STATE } from "./chat-state";
import type { ChatQuota } from "./contracts";

interface UseChatSessionOptions {
  api: ChatApi;
  taskType: string | null;
  language: "en" | "vi";
  onQuota: (quota: ChatQuota) => void;
}

/**
 * One conversation. The server decides which session is the latest on load; this only mints a session id
 * for a student who has none yet, and again when they press "New chat".
 */
export function useChatSession({ api, taskType, language, onQuota }: UseChatSessionOptions) {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_CHAT_STATE);

  const load = useCallback(async () => {
    try {
      const session = await api.getLatestSession();
      dispatch({ type: "loaded", session, newSessionId: createChatSessionId() });
    } catch (error) {
      // Do not mint a session here: "the server has none" and "the server could not be reached" differ, and a
      // fresh id would silently replace the student's real latest conversation. The composer stays locked
      // until a retry succeeds.
      dispatch({ type: "sendFailed", errorKey: chatErrorKey(error) });
    }
  }, [api]);

  const send = useCallback(async () => {
    const input = validateChatInput(state.draft);
    if (!input.ok || state.pending || !state.sessionId) return;
    dispatch({ type: "sendStarted", question: input.text });
    try {
      const reply = await api.sendMessage({ sessionId: state.sessionId, message: input.text, taskType, language });
      dispatch({ type: "sendSucceeded", question: input.text, reply });
      onQuota({
        used: reply.limit - reply.remaining,
        remaining: reply.remaining,
        limit: reply.limit,
        resetAt: reply.resetAt,
      });
    } catch (error) {
      const exhausted = quotaFromError(error);
      if (exhausted) onQuota(exhausted);
      dispatch({ type: "sendFailed", errorKey: chatErrorKey(error) });
    }
  }, [api, language, onQuota, state.draft, state.pending, state.sessionId, taskType]);

  const setDraft = useCallback((text: string) => dispatch({ type: "draftChanged", text }), []);
  const startNewChat = useCallback(() => dispatch({ type: "newChat", sessionId: createChatSessionId() }), []);
  const dismissError = useCallback(() => dispatch({ type: "dismissError" }), []);

  return { state, load, send, setDraft, startNewChat, dismissError };
}
