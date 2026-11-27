"use client";

import { useSearchParams } from "next/navigation";
import { useState, type ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeSessionTokens } from "@/features/practice/contracts";
import { clearPracticeSession, savePracticeSession } from "@/features/practice/session-storage";
import { AuthShell } from "./AuthShell";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { FORGOT_PASSWORD_PARAM } from "./forgot-password-param";
import { returnPath } from "./return-path";
import { SignInForm } from "./SignInForm";

interface PendingPasswordChange {
  tokens: PracticeSessionTokens;
  currentPassword: string;
}

export const SignInView = (): ReactElement => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingPasswordChange | null>(null);
  // A spent reset link sends the student back here already on the "forgot password" step.
  const [isForgotten, setIsForgotten] = useState(useSearchParams().get(FORGOT_PASSWORD_PARAM) === "1");

  function handleSignedIn(tokens: PracticeSessionTokens, password: string) {
    // change-password needs the bearer token, so it is stored before the forced change.
    savePracticeSession(tokens);
    if (tokens.mustChangePassword) {
      setPending({ tokens, currentPassword: password });
      return;
    }
    enterApp();
  }

  function handlePasswordChanged() {
    if (pending) savePracticeSession({ ...pending.tokens, mustChangePassword: false });
    enterApp();
  }

  /**
   * A full page load into the app rather than a client navigation: the student shell then starts from the stored
   * session, and a stalled client transition can no longer leave the form stuck on "Signing in...".
   */
  function enterApp() {
    window.location.replace(returnPath(window.location.search));
  }

  function handleCancelChange() {
    clearPracticeSession();
    setPending(null);
  }

  if (pending) {
    return (
      <AuthShell>
        <ChangePasswordForm currentPassword={pending.currentPassword}
          onChanged={handlePasswordChanged} onCancel={handleCancelChange} />
      </AuthShell>
    );
  }

  if (isForgotten) {
    return <AuthShell><ForgotPasswordForm onBack={() => setIsForgotten(false)} /></AuthShell>;
  }

  return (
    <AuthShell>
      <div>
        <h1 id="sign-in-title">{t("auth.welcomeTitle")}</h1>
        <p className="sign-in-lead">{t("auth.description")}</p>
      </div>
      <SignInForm onSignedIn={handleSignedIn} onForgotPassword={() => setIsForgotten(true)} />
    </AuthShell>
  );
};
