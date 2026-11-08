"use client";

import { type FormEvent, type ReactElement, useMemo, useState } from "react";
import { AppIcon, useToast } from "@/common/components";
import { useSignInValidation } from "@/common/hooks/useSignInValidation";
import { useTranslation } from "@/common/i18n";
import { createPracticeApiClient } from "@/features/practice/api";
import type { PracticeSessionTokens } from "@/features/practice/contracts";
import { DEV_TEST_ACCOUNTS_ENV, IS_DEV_BUILD } from "./constants";
import { parseDevTestAccounts } from "./dev-accounts";
import { hasStudentRole } from "./token-claims";
import { signInErrorKey } from "./login-error";

interface SignInFormProps {
  onSignedIn: (tokens: PracticeSessionTokens, password: string) => void;
}

export const SignInForm = ({ onSignedIn }: SignInFormProps): ReactElement => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const devAccounts = useMemo(() => (IS_DEV_BUILD ? parseDevTestAccounts(DEV_TEST_ACCOUNTS_ENV) : []), []);
  const messages = useMemo(() => ({ usernameRequired: t("auth.usernameRequired"), usernameInvalidEmail: t("auth.usernameRequired"),
    passwordRequired: t("auth.passwordRequired") }), [t]);
  // Roster usernames are not emails, so only "required" is checked before calling the server.
  const validation = useSignInValidation(messages, false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const found = validation.validateAll({ username, password });
    if (found.username || found.password) return;
    setIsSubmitting(true);
    try {
      const tokens = await createPracticeApiClient().login({ username: username.trim(), password });
      if (!hasStudentRole(tokens.accessToken)) {
        showToast(t("auth.notStudent"), { tone: "error" });
        setIsSubmitting(false);
        return;
      }
      onSignedIn(tokens, password);
    } catch (error) {
      showToast(t(signInErrorKey(error)), { tone: "error" });
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form sign-in-form" onSubmit={signIn} noValidate>
      <div className="auth-control-group">
        <label htmlFor="username">{t("auth.usernameLabel")}</label>
        <div className="auth-field">
          <span className="auth-field-icon"><AppIcon name="mail" size={18} /></span>
          <input id="username" name="username" autoComplete="username" value={username} required
            aria-invalid={validation.errors.username ? true : undefined}
            aria-describedby={validation.errors.username ? "username-error" : undefined}
            placeholder={t("auth.usernamePlaceholder")} onBlur={(event) => validation.onBlur("username", event.target.value)}
            onChange={(event) => { setUsername(event.target.value); validation.onChange("username", event.target.value); }} />
          <span className="auth-field-valid" aria-hidden="true" data-visible={Boolean(username && !validation.errors.username)}><AppIcon name="tick" size={18} /></span>
        </div>
        {validation.errors.username ? <p className="auth-field-error" id="username-error" role="alert">{validation.errors.username}</p> : null}
      </div>
      <div className="auth-control-group">
        <label htmlFor="password">{t("auth.passwordLabel")}</label>
        <div className="auth-field password-field">
          <span className="auth-field-icon"><AppIcon name="lock" size={18} /></span>
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
            value={password} required placeholder={t("auth.passwordPlaceholder")}
            aria-invalid={validation.errors.password ? true : undefined}
            aria-describedby={validation.errors.password ? "password-error" : undefined}
            onBlur={(event) => validation.onBlur("password", event.target.value)}
            onChange={(event) => { setPassword(event.target.value); validation.onChange("password", event.target.value); }} />
          <span className="auth-field-valid" aria-hidden="true" data-visible={Boolean(password && !validation.errors.password)}><AppIcon name="tick" size={18} /></span>
          <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={showPassword}>
            <AppIcon name={showPassword ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>
        {validation.errors.password ? <p className="auth-field-error" id="password-error" role="alert">{validation.errors.password}</p> : null}
      </div>
      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("auth.submitting") : t("auth.submit")}
      </button>
      {devAccounts.length ? (
        <div className="dev-accounts" role="group" aria-label={t("auth.devAccounts")}>
          <span>{t("auth.devAccounts")}</span>
          {devAccounts.map((account) => (
            <button key={account.username} type="button" className="dev-account-chip"
              onClick={() => { setUsername(account.username); setPassword(account.password); }}>
              {account.username}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
};
