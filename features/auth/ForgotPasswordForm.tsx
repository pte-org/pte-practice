"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { createPracticeApiClient } from "@/features/practice/api";

interface ForgotPasswordFormProps { onBack: () => void }

/** Neither a username nor an e-mail may carry spaces, so they are dropped as they are typed. */
const withoutSpaces = (value: string): string => value.replace(/\s/g, "");

/**
 * Asks for a reset link, mirroring the organization portal's form. The server answers the same whether or not the
 * account exists, so this form ends on the same notice either way: naming which accounts exist would hand that
 * list to anyone who asks.
 */
export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps): ReactElement {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const backLink = (
    <button className="text-button sign-in-back" type="button" onClick={onBack}>{t("auth.backToSignIn")}</button>
  );

  async function requestLink(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (isSubmitting) return;
    if (!username) {
      setErrorKey("auth.usernameRequired");
      return;
    }
    if (!email) {
      setErrorKey("auth.emailRequired");
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    // A failure is hidden on purpose: the notice must not depend on what the server knows.
    await createPracticeApiClient().requestPasswordReset({ username, email }).catch(() => undefined);
    setIsSubmitting(false);
    setIsSent(true);
  }

  if (isSent) {
    return (
      <>
        <div>
          <h1 className="sign-in-step-title">{t("auth.resetLinkSentTitle")}</h1>
          <p className="sign-in-lead">{t("auth.resetLinkSentDescription")}</p>
        </div>
        {backLink}
      </>
    );
  }

  return (
    <>
      <div>
        <h1 className="sign-in-step-title">{t("auth.forgotPasswordTitle")}</h1>
        <p className="sign-in-lead">{t("auth.forgotPasswordDescription")}</p>
      </div>
      {errorKey ? <p className="form-error" role="alert">{t(errorKey)}</p> : null}
      <form className="auth-form sign-in-form" noValidate onSubmit={(event) => void requestLink(event)}>
        <label htmlFor="forgot-username">{t("auth.usernameLabel")}</label>
        <div className="auth-field">
          <span className="auth-field-icon"><AppIcon name="account" size={18} /></span>
          <input id="forgot-username" value={username} autoComplete="username"
            placeholder={t("auth.usernamePlaceholder")}
            onChange={(event) => setUsername(withoutSpaces(event.target.value))} />
        </div>
        <label htmlFor="forgot-email">{t("auth.emailLabel")}</label>
        <div className="auth-field">
          <span className="auth-field-icon"><AppIcon name="mail" size={18} /></span>
          <input id="forgot-email" type="email" value={email} autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            onChange={(event) => setEmail(withoutSpaces(event.target.value))} />
        </div>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
        </button>
      </form>
      {backLink}
    </>
  );
}
