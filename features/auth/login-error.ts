import type { TranslationKey } from "@/common/i18n";
import { PracticeApiError } from "@/features/practice/api";

/** Keep login errors contextual and localized; never display raw API/provider messages. */
export function signInErrorKey(error: unknown): TranslationKey {
  if (!(error instanceof PracticeApiError)) return "auth.genericError";
  if (error.status === 0) return "auth.networkError";
  if (error.status === 429) return "auth.rateLimited";
  if (error.status >= 500) return "auth.serviceUnavailable";
  if (error.status === 400 || error.status === 401) return "auth.invalidCredentials";
  return "auth.genericError";
}
