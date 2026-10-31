"use client";

import Image from "next/image";
import { useState } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { useTheme } from "@/common/providers/ThemeProvider";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import type { PracticeSessionTokens } from "@/features/practice/contracts";
import { clearPracticeSession, savePracticeSession } from "@/features/practice/session-storage";
import { AuthBackdrop } from "./AuthBackdrop";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { BRAND_NAME } from "./constants";
import { OrbitPanel } from "./OrbitPanel";
import { SignInForm } from "./SignInForm";

const LOGO_WIDTH = 482;
const LOGO_HEIGHT = 567;

interface PendingPasswordChange {
  tokens: PracticeSessionTokens;
  currentPassword: string;
}

export function SignInView() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [pending, setPending] = useState<PendingPasswordChange | null>(null);

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
    window.location.replace(PRACTICE_ROUTES.home);
  }

  function handleCancelChange() {
    clearPracticeSession();
    setPending(null);
  }

  return (
    <main className="sign-in-page">
      <AuthBackdrop />
      <div className="sign-in-toolbar">
        <button className="icon-button" type="button" onClick={() => setLocale(locale === "en" ? "vi" : "en")}
          aria-label={t("auth.toggleLanguage")} title={t("auth.toggleLanguage")}>{locale.toUpperCase()}</button>
        <button className="icon-button" type="button" onClick={toggleTheme}
          aria-label={t("auth.toggleTheme")} title={t("auth.toggleTheme")}>
          <AppIcon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
      </div>

      <div className="sign-in-stage">
        <div className="sign-in-card">
          <OrbitPanel title={t("auth.showcaseLabel")} />
          <div className="sign-in-column">
            <div className="sign-in-brand">
              <Image src="/logo-mark.png" alt="" width={LOGO_WIDTH} height={LOGO_HEIGHT} priority className="sign-in-logo" />
              <span>
                <strong>{BRAND_NAME.prefix} {BRAND_NAME.suffix}</strong>
                <small>{t("auth.brandTagline")}</small>
              </span>
            </div>
            <div className="sign-in-body">
              {pending ? (
                <ChangePasswordForm currentPassword={pending.currentPassword}
                  onChanged={handlePasswordChanged} onCancel={handleCancelChange} />
              ) : (
                <>
                  <div>
                    <h1 id="sign-in-title">
                      {t("auth.headingStart")}<span className="sign-in-highlight">{t("auth.headingHighlight")}</span>{t("auth.headingEnd")}
                    </h1>
                    <p className="sign-in-lead">{t("auth.description")}</p>
                  </div>
                  <SignInForm onSignedIn={handleSignedIn} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
