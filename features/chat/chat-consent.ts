import type { ChatErrorKey } from "./chat-errors";
import type { ChatConsent } from "./contracts";

/** `loading` until the server answers, `failed` when it could not be asked: chat stays closed in both. */
export type ChatConsentStatus = "loading" | "required" | "granted" | "failed";

export interface ChatConsentState {
  status: ChatConsentStatus;
  pending: boolean;
  errorKey: ChatErrorKey | null;
  /** The student ticked "I am at least 16, or a parent or guardian agrees, and I agree". */
  ageChecked: boolean;
}

export const INITIAL_CONSENT_STATE: ChatConsentState = {
  status: "loading",
  pending: false,
  errorKey: null,
  ageChecked: false,
};

export type ChatConsentAction =
  | { type: "loaded"; consent: ChatConsent }
  | { type: "loadFailed"; errorKey: ChatErrorKey }
  | { type: "ageToggled"; checked: boolean }
  | { type: "acceptStarted" }
  | { type: "acceptSucceeded" }
  | { type: "acceptFailed"; errorKey: ChatErrorKey }
  | { type: "required" };

export function chatConsentReducer(state: ChatConsentState, action: ChatConsentAction): ChatConsentState {
  switch (action.type) {
    case "loaded":
      return { ...state, status: action.consent.consented ? "granted" : "required", pending: false, errorKey: null };
    case "loadFailed":
      return { ...state, status: "failed", pending: false, errorKey: action.errorKey };
    case "ageToggled":
      return { ...state, ageChecked: action.checked };
    case "acceptStarted":
      return { ...state, pending: true, errorKey: null };
    case "acceptSucceeded":
      return { ...state, status: "granted", pending: false, errorKey: null };
    case "acceptFailed":
      return { ...state, pending: false, errorKey: action.errorKey };
    case "required":
      // The server refused a message for missing consent (for example the notice changed): ask again from scratch.
      return { ...state, status: "required", pending: false, errorKey: null, ageChecked: false };
  }
}

export function canAcceptConsent(state: ChatConsentState): boolean {
  return state.status === "required" && state.ageChecked && !state.pending;
}

export function consentBlocksChat(status: ChatConsentStatus): boolean {
  return status !== "granted";
}
