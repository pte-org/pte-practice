import { PracticeApiError } from "@/features/practice/api";
import { CHAT_CONSENT_ERROR_CODE } from "./constants";

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

/**
 * True when the server says chat is not for this student at all: practice is locked for them (403) or the
 * chat endpoints do not exist because the backend has chat switched off (404). Then the button is hidden
 * instead of leading to an error. A missing privacy consent is a 403 too, but the panel handles that itself;
 * network errors, 5xx and 429 may pass, so they keep the button.
 */
export function isChatUnavailable(error: unknown): boolean {
  if (!(error instanceof PracticeApiError)) return false;
  if (error.code === CHAT_CONSENT_ERROR_CODE) return false;
  return error.status === HTTP_FORBIDDEN || error.status === HTTP_NOT_FOUND;
}
