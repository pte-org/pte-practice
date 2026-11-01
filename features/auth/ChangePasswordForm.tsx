"use client";

import { type FormEvent, useState } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { createPracticeApiClient } from "@/features/practice/api";
import { getPracticeSession } from "@/features/practice/session-storage";
import { buildChangePasswordBody } from "./change-password-body";
import { MIN_PASSWORD_LENGTH, PASSWORD_CHANGED_NOTICE_MS } from "./constants";

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
  const [isChanged, setIsChanged] = useState(false);
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
      await createPracticeApiClient().changePassword(
        buildChangePasswordBody(currentPassword, newPassword, getPracticeSession()),
      );
      setIsChanged(true);
      // Let the student see the confirmation before the page moves on.
      window.setTimeout(onChanged, PASSWORD_CHANGED_NOTICE_MS);
    } catch {
      setErrorKey("auth.changePasswordError");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form sign-in-form" onSubmit={changePassword}>
      <h1 className="sign-in-step-title">{t("auth.changePasswordTitle")}</h1>
      <p className="auth-description">{t("auth.changePasswordDescription")}</p>
      <label htmlFor="new-password">{t("auth.newPasswordLabel")}</label>
      <div className="auth-field">
        <span className="auth-field-icon"><AppIcon name="lock" size={18} /></span>
        <input id="new-password" type="password" autoComplete="new-password" required value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)} />
      </div>
      <label htmlFor="confirm-password">{t("auth.confirmPasswordLabel")}</label>
      <div className="auth-field">
        <span className="auth-field-icon"><AppIcon name="lock" size={18} /></span>
        <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)} />
      </div>
      {errorKey ? <p className="form-error" role="alert">{t(errorKey)}</p> : null}
      {isChanged ? (
        <p className="form-success" role="status">
          <AppIcon name="check" size={18} /> {t("auth.passwordChanged")}
        </p>
      ) : null}
      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isChanged ? t("auth.passwordChanged") : isSubmitting ? t("auth.changingPassword") : t("auth.changePasswordSubmit")}
      </button>
      <button className="button button-outline-danger button-wide button-pill" type="button" disabled={isSubmitting} onClick={onCancel}>
        {t("auth.backToSignIn")}
      </button>
    </form>
  );
}
