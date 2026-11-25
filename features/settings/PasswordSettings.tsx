"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { AppIcon, Button, PasswordField } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { newPasswordError } from "@/features/auth/password-rules";
import { buildChangePasswordBody } from "@/features/auth/change-password-body";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { ATTEMPT_IN_PROGRESS_ERROR_CODE, INVALID_LOGIN_ERROR_CODE } from "@/features/practice/constants";
import { getPracticeSession } from "@/features/practice/session-storage";

const HTTP_BAD_REQUEST = 400;

/**
 * What the server refused. A validation refusal (400) carries the server's own wording of the rule, which the
 * organization portal shows as it is; a wrong current password and a started exam have messages of their own.
 */
function refusalText(error: unknown, t: (key: TranslationKey) => string): string {
  if (!(error instanceof PracticeApiError)) return t("settings.changePasswordFailed");
  if (error.code === INVALID_LOGIN_ERROR_CODE) return t("settings.currentPasswordWrong");
  if (error.code === ATTEMPT_IN_PROGRESS_ERROR_CODE) return t("settings.passwordLockedInExam");
  if (error.status === HTTP_BAD_REQUEST && error.message) return error.message;
  return t("settings.changePasswordFailed");
}

/** Changing the password from Settings: the same three fields, checks and order as the tenant portal's form. */
export const PasswordSettings = (): ReactElement => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = (): void => {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setError(null);
  };

  const openForm = (): void => {
    setIsChanged(false);
    setOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    // One "all fields" message first, then the rules in the portal's order: too short, edge spaces, mismatch.
    const ruleError = !currentPassword || !newPassword || !confirmation
      ? "settings.passwordAllRequired" : newPasswordError(newPassword, confirmation);
    if (ruleError) {
      setError(t(ruleError));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      // The server keeps this session and signs the student's other devices out.
      await createPracticeApiClient().changePassword(
        buildChangePasswordBody(currentPassword, newPassword, getPracticeSession()),
      );
      close();
      setIsChanged(true);
    } catch (failure) {
      setError(refusalText(failure, t));
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
      <form className="auth-form student-settings-password-form" noValidate onSubmit={(event) => void submit(event)}>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <PasswordField label={t("settings.currentPasswordLabel")} autoComplete="current-password" withIcon={false}
          value={currentPassword} onChange={setCurrentPassword} />
        <PasswordField label={t("auth.newPasswordLabel")} withIcon={false} value={newPassword} onChange={setNewPassword} />
        <PasswordField label={t("auth.confirmPasswordLabel")} withIcon={false} value={confirmation}
          onChange={setConfirmation} />
        <Button type="submit" size="sm" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("auth.changingPassword") : t("settings.changePassword")}
        </Button>
        <Button variant="secondary" size="sm" fullWidth disabled={isSubmitting} onClick={close}>{t("session.cancel")}</Button>
      </form>
    </section>
  );
};
