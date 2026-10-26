"use client";

import { type FormEvent, useState } from "react";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { createPracticeApiClient } from "@/features/practice/api";
import { MIN_PASSWORD_LENGTH } from "./constants";

interface ChangePasswordFormProps {
  currentPassword: string;
  onChanged: () => void;
  onCancel: () => void;
}

/** First sign-in with a roster password: the student must replace it before entering practice. */
export function ChangePasswordForm({ currentPassword, onChanged, onCancel }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorKey("auth.passwordTooShort");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorKey("auth.passwordMismatch");
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await createPracticeApiClient().changePassword({ currentPassword, newPassword });
      onChanged();
    } catch {
      setErrorKey("auth.changePasswordError");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form sign-in-form" onSubmit={changePassword}>
      <h2 className="sign-in-step-title">{t("auth.changePasswordTitle")}</h2>
      <p className="auth-description">{t("auth.changePasswordDescription")}</p>
      <label htmlFor="new-password">{t("auth.newPasswordLabel")}</label>
      <input id="new-password" type="password" autoComplete="new-password" required value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)} />
      <label htmlFor="confirm-password">{t("auth.confirmPasswordLabel")}</label>
      <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)} />
      {errorKey ? <p className="form-error" role="alert">{t(errorKey)}</p> : null}
      <button className="button button-primary button-wide button-pill" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("auth.changingPassword") : t("auth.changePasswordSubmit")}
      </button>
      <button className="button button-outline-danger button-wide button-pill" type="button" disabled={isSubmitting} onClick={onCancel}>
        {t("auth.backToSignIn")}
      </button>
    </form>
  );
}
