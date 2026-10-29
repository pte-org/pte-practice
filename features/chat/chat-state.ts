import type { ChatErrorKey } from "./chat-errors";
import { validateChatInput } from "./chat-input";
import { isQuotaExhausted } from "./chat-quota";
import type { ChatHistoryItem, ChatLatestSession, ChatQuota, ChatReply } from "./contracts";

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  text: string;
  refused: boolean;
}

export interface ChatState {
  sessionId: string | null;
  messages: ChatMessageView[];
  pending: boolean;
  /** Shown under the list while the answer is on its way; never added to `messages` until it succeeds. */
  pendingQuestion: string | null;
  errorKey: ChatErrorKey | null;
  /** Kept on failure so the student does not retype the question. */
  draft: string;
  loaded: boolean;
}

export const INITIAL_CHAT_STATE: ChatState = {
  sessionId: null,
  messages: [],
  pending: false,
  pendingQuestion: null,
  errorKey: null,
  draft: "",
  loaded: false,
};

export type ChatAction =
  | { type: "loaded"; session: ChatLatestSession; newSessionId: string }
  | { type: "draftChanged"; text: string }
  | { type: "sendStarted"; question: string }
  | { type: "sendSucceeded"; question: string; reply: ChatReply }
  | { type: "requestFailed"; errorKey: ChatErrorKey }
  | { type: "newChat"; sessionId: string }
  | { type: "dismissError" };

function exchange(firstIndex: number, question: string, answer: string, refused: boolean): ChatMessageView[] {
  return [
    { id: `message-${firstIndex}`, role: "user", text: question, refused: false },
    { id: `message-${firstIndex + 1}`, role: "assistant", text: answer, refused },
  ];
}

function fromHistory(items: ChatHistoryItem[]): ChatMessageView[] {
  // FAILED rows have an empty answer and exist only for cost tracking.
  return items
    .filter((item) => item.status !== "FAILED")
    .flatMap((item, index) => exchange(index * 2, item.question, item.answer, item.status === "REFUSED"));
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "loaded":
      return {
        ...state,
        sessionId: action.session.sessionId ?? action.newSessionId,
        messages: fromHistory(action.session.messages),
        loaded: true,
      };
    case "draftChanged":
      return { ...state, draft: action.text };
    case "sendStarted":
      return { ...state, pending: true, pendingQuestion: action.question, errorKey: null };
    case "sendSucceeded":
      return {
        ...state,
        messages: [
          ...state.messages,
          ...exchange(state.messages.length, action.question, action.reply.markdown, !action.reply.onTopic),
        ],
        pending: false,
        pendingQuestion: null,
        draft: "",
        errorKey: null,
        sessionId: action.reply.sessionId,
      };
    case "requestFailed":
      return { ...state, pending: false, pendingQuestion: null, errorKey: action.errorKey };
    case "newChat":
      if (state.pending) return state;
      return { ...state, sessionId: action.sessionId, messages: [], draft: "", errorKey: null, pendingQuestion: null };
    case "dismissError":
      return { ...state, errorKey: null };
  }
}

export type ChatComposerReason = "pending" | "exhausted" | "empty" | "too_long";

export function chatComposerState(input: { quota: ChatQuota | null; pending: boolean; draft: string }): {
  disabled: boolean;
  reason: ChatComposerReason | null;
} {
  let reason: ChatComposerReason | null = null;
  if (input.pending) {
    reason = "pending";
  } else if (isQuotaExhausted(input.quota)) {
    reason = "exhausted";
  } else {
    const validation = validateChatInput(input.draft);
    if (!validation.ok) reason = validation.reason;
  }
  return { disabled: reason !== null, reason };
}
