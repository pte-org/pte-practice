"use client";

import { useCallback, useReducer } from "react";
import type { ChatApi } from "./api";
import { chatErrorKey } from "./chat-errors";
import { buildSendInput } from "./chat-exercise";
import { historyForRequest } from "./chat-history";
import { validateChatInput } from "./chat-input";
import { quotaFromError } from "./chat-quota";
import { chatReducer, INITIAL_CHAT_STATE } from "./chat-state";
import type { ChatQuota } from "./contracts";

interface UseChatSessionOptions {
  api: ChatApi;
  taskType: string | null;
  /** Text of the exercise on screen (already cut to the allowed length), or null. */
  exercisePrompt: string | null;
  language: "en" | "vi";
  onQuota: (quota: ChatQuota) => void;
}

/**
 * One conversation, held in memory only. Each question carries the earlier turns because the server keeps
 * nothing between requests; "New chat" simply forgets them.
 */
export function useChatSession({ api, taskType, exercisePrompt, language, onQuota }: UseChatSessionOptions) {
  const [state, dispatch] = useReducer(chatReducer, INITIAL_CHAT_STATE);

  const send = useCallback(async () => {
    const input = validateChatInput(state.draft);
    if (!input.ok || state.pending) return;
    dispatch({ type: "sendStarted", question: input.text });
    try {
      const reply = await api.sendMessage(
        buildSendInput({
          message: input.text,
          taskType,
          language,
          exercisePrompt,
          history: historyForRequest(state.messages),
        }),
      );
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
      dispatch({ type: "requestFailed", errorKey: chatErrorKey(error) });
    }
  }, [api, exercisePrompt, language, onQuota, state.draft, state.messages, state.pending, taskType]);

  const setDraft = useCallback((text: string) => dispatch({ type: "draftChanged", text }), []);
  const startNewChat = useCallback(() => dispatch({ type: "newChat" }), []);
  const dismissError = useCallback(() => dispatch({ type: "dismissError" }), []);

  return { state, send, setDraft, startNewChat, dismissError };
}
