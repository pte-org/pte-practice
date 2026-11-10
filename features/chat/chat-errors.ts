import { PracticeApiError } from "@/features/practice/api";
import { CHAT_ERROR_CODES } from "./constants";

export type ChatErrorKey =
  | "quotaExceeded"
  | "inFlight"
  | "busy"
  | "invalidRequest"
  | "network"
  | "accessDenied"
  | "unavailable"
  | "generic";

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

/** Maps a failed request to an i18n key; the server's English `userMessage` is never shown to students. */
export function chatErrorKey(error: unknown): ChatErrorKey {
  if (!(error instanceof PracticeApiError)) return "generic";
  if (error.status === HTTP_FORBIDDEN) return "accessDenied";
  if (error.status === HTTP_NOT_FOUND) return "unavailable";
  switch (error.code) {
    case CHAT_ERROR_CODES.quotaExceeded: return "quotaExceeded";
    case CHAT_ERROR_CODES.inFlight: return "inFlight";
    case CHAT_ERROR_CODES.busy: return "busy";
    case CHAT_ERROR_CODES.invalidRequest: return "invalidRequest";
    default: break;
  }
  if (error.status === 0 || error.code === "NETWORK_ERROR") return "network";
  // A 429 without a chat code comes from the global rate limiter, not the chat quota.
  if (error.status === HTTP_TOO_MANY_REQUESTS) return "busy";
  return "generic";
}
