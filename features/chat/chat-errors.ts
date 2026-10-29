import { PracticeApiError } from "@/features/practice/api";
import { CHAT_CONSENT_ERROR_CODE, CHAT_ERROR_CODES } from "./constants";

export type ChatErrorKey =
  | "consentRequired"
  | "quotaExceeded"
  | "inFlight"
  | "busy"
  | "sessionNotFound"
  | "invalidRequest"
  | "network"
  | "generic";

const HTTP_TOO_MANY_REQUESTS = 429;

/** Maps a failed request to an i18n key; the server's English `userMessage` is never shown to students. */
export function chatErrorKey(error: unknown): ChatErrorKey {
  if (!(error instanceof PracticeApiError)) return "generic";
  switch (error.code) {
    case CHAT_ERROR_CODES.quotaExceeded: return "quotaExceeded";
    case CHAT_ERROR_CODES.inFlight: return "inFlight";
    case CHAT_ERROR_CODES.busy: return "busy";
    case CHAT_ERROR_CODES.sessionNotFound: return "sessionNotFound";
    case CHAT_ERROR_CODES.invalidRequest: return "invalidRequest";
    case CHAT_CONSENT_ERROR_CODE: return "consentRequired";
    default: break;
  }
  if (error.status === 0 || error.code === "NETWORK_ERROR") return "network";
  // A 429 without a chat code comes from the global rate limiter, not the chat quota.
  if (error.status === HTTP_TOO_MANY_REQUESTS) return "busy";
  return "generic";
}
