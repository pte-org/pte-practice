"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useSignInValidation } from "@/common/hooks/useSignInValidation";
import { useTranslation } from "@/common/i18n";
import { FieldWarning } from "@/features/practice/session/FieldWarning";
import type { TranslationKey } from "@/common/i18n";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import type { PracticeSessionTokens } from "@/features/practice/contracts";
import { DEV_TEST_ACCOUNTS_ENV, IS_DEV_BUILD } from "./constants";
import { parseDevTestAccounts } from "./dev-accounts";
import { hasStudentRole } from "./token-claims";

interface SignInFormProps {
  onSignedIn: (tokens: PracticeSessionTokens, password: string) => void;
}

export function SignInForm({ onSignedIn }: SignInFormProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const devAccounts = useMemo(() => (IS_DEV_BUILD ? parseDevTestAccounts(DEV_TEST_ACCOUNTS_ENV) : []), []);
  const messages = useMemo(() => ({ usernameRequired: t("auth.usernameRequired"), usernameInvalidEmail: t("auth.usernameRequired"),
    passwordRequired: t("auth.passwordRequired") }), [t]);
  // Roster usernames are not emails, so only "required" is checked before calling the server.
  const validation = useSignInValidation(messages, false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorKey(null);
    const found = validation.validateAll({ username, password });
    if (found.username || found.password) return;
    setIsSubmitting(true);
    try {
      const tokens = await createPracticeApiClient().login({ username: username.trim(), password });
      if (!hasStudentRole(tokens.accessToken)) {
        setErrorKey("auth.notStudent");
        setIsSubmitting(false);
        return;
      }
      onSignedIn(tokens, password);
    } catch (error) {
      setErrorKey(signInErrorKey(error));
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form sign-in-form" onSubmit={signIn} noValidate>
      <label htmlFor="username">{t("auth.usernameLabel")}</label>
      <input id="username" name="username" autoComplete="username" value={username} required
        aria-invalid={validation.errors.username ? true : undefined}
        placeholder={t("auth.usernamePlaceholder")} onBlur={(event) => validation.onBlur("username", event.target.value)}
        onChange={(event) => { setUsername(event.target.value); validation.onChange("username", event.target.value); }} />
      {validation.errors.username ? <FieldWarning message={validation.errors.username} /> : null}
      <label htmlFor="password">{t("auth.passwordLabel")}</label>
      <div className="password-field">
        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
          value={password} required placeholder={t("auth.passwordPlaceholder")}
          aria-invalid={validation.errors.password ? true : undefined}
          onBlur={(event) => validation.onBlur("password", event.target.value)}
          onChange={(event) => { setPassword(event.target.value); validation.onChange("password", event.target.value); }} />
        <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={showPassword}>
          {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
        </button>
      </div>
      {validation.errors.password ? <FieldWarning message={validation.errors.password} /> : null}
      {errorKey ? <p className="form-error" role="alert">{t(errorKey)}</p> : null}
      <button className="button button-outline button-wide button-pill" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("auth.submitting") : t("auth.submit")}
      </button>
      <p className="auth-footnote">{t("auth.forgotPassword")}</p>
      {devAccounts.length ? (
        <div className="dev-accounts" role="group" aria-label={t("auth.devAccounts")}>
          <span>{t("auth.devAccounts")}</span>
          {devAccounts.map((account) => (
            <button key={account.username} type="button" className="dev-account-chip"
              onClick={() => { setUsername(account.username); setPassword(account.password); setErrorKey(null); }}>
              {account.username}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function signInErrorKey(error: unknown): TranslationKey {
  if (!(error instanceof PracticeApiError)) return "auth.genericError";
  if (error.status === 429) return "auth.rateLimited";
  if (error.status === 400 || error.status === 401) return "auth.invalidCredentials";
  return "auth.genericError";
}
