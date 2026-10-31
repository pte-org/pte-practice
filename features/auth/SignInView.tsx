"use client";

import { useState } from "react";
import { AppIcon, ProductMark } from "@/common/components";
import type { IconName } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { useTheme } from "@/common/providers/ThemeProvider";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import type { PracticeSessionTokens } from "@/features/practice/contracts";
import { clearPracticeSession, savePracticeSession } from "@/features/practice/session-storage";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { BRAND_NAME } from "./constants";
import { SignInForm } from "./SignInForm";
import { SignInShowcase } from "./SignInShowcase";

const FEATURES: ReadonlyArray<{ icon: IconName; title: TranslationKey; description: TranslationKey }> = [
  { icon: "bookOpen", title: "auth.featureTasksTitle", description: "auth.featureTasksDescription" },
  { icon: "sparkle", title: "auth.featureScoringTitle", description: "auth.featureScoringDescription" },
  { icon: "progress", title: "auth.featureProgressTitle", description: "auth.featureProgressDescription" },
];

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
    <div className="sign-in-page">
      <header className="sign-in-top">
        <div className="sign-in-brand">
          <span className="brand-mark brand-mark-small" aria-hidden="true"><ProductMark /></span>
          <span><strong>{BRAND_NAME.prefix}<b>{BRAND_NAME.suffix}</b></strong><small>{t("auth.brandTagline")}</small></span>
        </div>
        <div className="sign-in-top-actions">
          <button className="icon-button" type="button" onClick={() => setLocale(locale === "en" ? "vi" : "en")}
            aria-label={t("auth.toggleLanguage")} title={t("auth.toggleLanguage")}>{locale.toUpperCase()}</button>
          <button className="icon-button" type="button" onClick={toggleTheme}
            aria-label={t("auth.toggleTheme")} title={t("auth.toggleTheme")}>
            <AppIcon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
        </div>
      </header>

      <main className="sign-in-main">
        <section className="sign-in-hero" aria-labelledby="sign-in-title">
          <div className="sign-in-copy">
            <h1 id="sign-in-title">
              {t("auth.headingStart")}<span className="sign-in-highlight">{t("auth.headingHighlight")}</span>{t("auth.headingEnd")}
            </h1>
            <p className="sign-in-lead">{t("auth.description")}</p>
            {pending ? (
              <ChangePasswordForm currentPassword={pending.currentPassword}
                onChanged={handlePasswordChanged} onCancel={handleCancelChange} />
            ) : (
              <SignInForm onSignedIn={handleSignedIn} />
            )}
          </div>
          <SignInShowcase />
        </section>

        <section className="sign-in-features">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="sign-in-feature">
              <span className="sign-in-feature-icon" aria-hidden="true"><AppIcon name={feature.icon} size={20} /></span>
              <h2>{t(feature.title)}</h2>
              <p>{t(feature.description)}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
