import type { ChatErrorKey } from "./chat-errors";

export type ChatPrivacyAction = "withdraw" | "delete";

export interface ChatPrivacyState {
  /** The action the student is being asked to confirm, or null. */
  confirming: ChatPrivacyAction | null;
  pending: boolean;
  errorKey: ChatErrorKey | null;
}

export const INITIAL_PRIVACY_STATE: ChatPrivacyState = { confirming: null, pending: false, errorKey: null };

export type ChatPrivacyEvent =
  | { type: "ask"; action: ChatPrivacyAction }
  | { type: "cancel" }
  | { type: "started" }
  | { type: "succeeded" }
  | { type: "failed"; errorKey: ChatErrorKey };

/** Both actions are permanent, so each needs a second click; a failure leaves the question open to retry. */
export function chatPrivacyReducer(state: ChatPrivacyState, event: ChatPrivacyEvent): ChatPrivacyState {
  switch (event.type) {
    case "ask":
      return state.pending ? state : { confirming: event.action, pending: false, errorKey: null };
    case "cancel":
      return state.pending ? state : INITIAL_PRIVACY_STATE;
    case "started":
      return { ...state, pending: true, errorKey: null };
    case "succeeded":
      return INITIAL_PRIVACY_STATE;
    case "failed":
      return { ...state, pending: false, errorKey: event.errorKey };
  }
}
