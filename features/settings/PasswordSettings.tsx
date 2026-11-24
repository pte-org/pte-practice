"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { AppIcon, Button, PasswordField } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { newPasswordError } from "@/features/auth/password-rules";
import { buildChangePasswordBody } from "@/features/auth/change-password-body";
import { MAX_PASSWORD_LENGTH } from "@/features/auth/constants";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { ATTEMPT_IN_PROGRESS_ERROR_CODE, INVALID_LOGIN_ERROR_CODE } from "@/features/practice/constants";
import { getPracticeSession } from "@/features/practice/session-storage";

/** What the server refused, in the student's words. */
function refusalKey(error: unknown): TranslationKey {
  if (!(error instanceof PracticeApiError)) return "auth.changePasswordError";
  if (error.code === INVALID_LOGIN_ERROR_CODE) return "settings.currentPasswordWrong";
  if (error.code === ATTEMPT_IN_PROGRESS_ERROR_CODE) return "settings.passwordLockedInExam";
  return "auth.changePasswordError";
}

/** Changing the password from Settings, with the same three fields and rules as the tenant portal's form. */
export const PasswordSettings = (): ReactElement => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const close = (): void => {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setErrorKey(null);
  };

  const openForm = (): void => {
    setIsChanged(false);
    setOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const ruleError = currentPassword ? newPasswordError(newPassword, confirmation) : "settings.currentPasswordRequired";
    if (ruleError) {
      setErrorKey(ruleError);
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      // The server keeps this session and signs the student's other devices out.
      await createPracticeApiClient().changePassword(
        buildChangePasswordBody(currentPassword, newPassword, getPracticeSession()),
      );
      close();
      setIsChanged(true);
    } catch (error) {
      setErrorKey(refusalKey(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return (
      <section className="student-settings-password">
        <h3>{t("settings.password")}</h3>
        <p className="student-settings-password-hint">{t("settings.passwordHint")}</p>
        {isChanged ? (
          <p className="form-success" role="status">
            <AppIcon name="check" size={18} /> {t("settings.passwordChanged")}
          </p>
        ) : null}
        <Button variant="secondary" size="sm" onClick={openForm}>{t("settings.changePassword")}</Button>
      </section>
    );
  }

  return (
    <section className="student-settings-password">
      <h3>{t("settings.changePassword")}</h3>
      <p className="student-settings-password-hint">{t("settings.changePasswordDescription")}</p>
      <form className="auth-form student-settings-password-form" onSubmit={(event) => void submit(event)}>
        {errorKey ? <p className="form-error" role="alert">{t(errorKey)}</p> : null}
        <PasswordField label={t("settings.currentPasswordLabel")} autoComplete="current-password" withIcon={false}
          maxLength={MAX_PASSWORD_LENGTH} value={currentPassword} onChange={setCurrentPassword} />
        <PasswordField label={t("auth.newPasswordLabel")} withIcon={false} maxLength={MAX_PASSWORD_LENGTH}
          value={newPassword} onChange={setNewPassword} />
        <PasswordField label={t("auth.confirmPasswordLabel")} withIcon={false} maxLength={MAX_PASSWORD_LENGTH}
          value={confirmation} onChange={setConfirmation} />
        <Button type="submit" size="sm" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("auth.changingPassword") : t("settings.changePassword")}
        </Button>
        <Button variant="secondary" size="sm" fullWidth disabled={isSubmitting} onClick={close}>{t("session.cancel")}</Button>
      </form>
    </section>
  );
};
