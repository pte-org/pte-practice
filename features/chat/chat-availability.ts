import { PracticeApiError } from "@/features/practice/api";
import { CHAT_ERROR_CODES } from "./constants";

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

/**
 * True when the server says chat is not for this student at all: practice is locked for them (403) or the
 * chat endpoints do not exist because the backend has chat switched off (404). Sending is blocked while
 * the panel stays available with an explanation and a retry. The platform admin switching the AI chat off
 * (503 AI_CHAT_DISABLED) blocks sending the same way. Other network errors, 5xx and 429 may pass.
 */
export function isChatUnavailable(error: unknown): boolean {
  if (!(error instanceof PracticeApiError)) return false;
  return error.status === HTTP_FORBIDDEN || error.status === HTTP_NOT_FOUND
    || error.code === CHAT_ERROR_CODES.disabled;
}
