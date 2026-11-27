import type { TranslationKey } from "@/common/i18n";
import { MIN_PASSWORD_LENGTH } from "./constants";

/** The first rule the replacement breaks, or null when it is fine. Same order as the tenant portal's form. */
export function newPasswordError(newPassword: string, confirmation: string): TranslationKey | null {
  if (!newPassword || !confirmation) return "auth.passwordBothRequired";
  if (newPassword.length < MIN_PASSWORD_LENGTH) return "auth.passwordTooShort";
  if (newPassword !== newPassword.trim()) return "auth.passwordEdgeSpaces";
  if (newPassword !== confirmation) return "auth.passwordMismatch";
  return null;
}
