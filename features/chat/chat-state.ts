import type { ChatErrorKey } from "./chat-errors";
import { validateChatInput } from "./chat-input";
import { isQuotaExhausted } from "./chat-quota";
import type { ChatQuota, ChatReply } from "./contracts";

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  text: string;
  refused: boolean;
}

/** The whole conversation lives here, in the page's memory: closing the tab or pressing "New chat" ends it. */
export interface ChatState {
  messages: ChatMessageView[];
  pending: boolean;
  /** Shown under the list while the answer is on its way; never added to `messages` until it succeeds. */
  pendingQuestion: string | null;
  errorKey: ChatErrorKey | null;
  /** Kept on failure so the student does not retype the question. */
  draft: string;
}

export const INITIAL_CHAT_STATE: ChatState = {
  messages: [],
  pending: false,
  pendingQuestion: null,
  errorKey: null,
  draft: "",
};

export type ChatAction =
  | { type: "draftChanged"; text: string }
  | { type: "sendStarted"; question: string }
  | { type: "sendSucceeded"; question: string; reply: ChatReply }
  | { type: "requestFailed"; errorKey: ChatErrorKey }
  | { type: "newChat" }
  | { type: "dismissError" };

function exchange(firstIndex: number, question: string, answer: string, refused: boolean): ChatMessageView[] {
  return [
    { id: `message-${firstIndex}`, role: "user", text: question, refused: false },
    { id: `message-${firstIndex + 1}`, role: "assistant", text: answer, refused },
  ];
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
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
      };
    case "requestFailed":
      return { ...state, pending: false, pendingQuestion: null, errorKey: action.errorKey };
    case "newChat":
      if (state.pending) return state;
      return { ...INITIAL_CHAT_STATE };
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
