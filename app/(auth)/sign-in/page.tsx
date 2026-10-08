"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductMark } from "@/common/components";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { savePracticeSession } from "@/features/practice/session-storage";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

type SignInStep = "email" | "verification";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<SignInStep>("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const challenge = await createPracticeApiClient().requestChallenge(email.trim());
      setChallengeId(challenge.challengeId);
      setStep("verification");
    } catch (error) {
      setErrorMessage(toSignInError(error, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const tokens = await createPracticeApiClient().verifyChallenge({
        challengeId,
        email: email.trim(),
        code: code.trim(),
      });
      savePracticeSession(tokens);
      router.replace("/");
    } catch (error) {
      setErrorMessage(toSignInError(error, t));
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
        <p className="eyebrow">PTE Practice</p>
        <h1 id="sign-in-title">{t("auth.title")}</h1>
        <p className="auth-description">{t("auth.description")}</p>

        {step === "email" ? (
          <form className="auth-form" onSubmit={requestCode}>
            <label htmlFor="email">{t("auth.emailLabel")}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
            />
            <button className="button button-primary button-wide" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("auth.sending") : t("auth.continue")}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyCode}>
            <label htmlFor="verification-code">{t("auth.codeLabel")}</label>
            <input
              id="verification-code"
              name="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder={t("auth.codePlaceholder")}
              required
            />
            <button className="button button-primary button-wide" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("auth.verifying") : t("auth.verify")}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setErrorMessage(null);
              }}
            >
              {t("auth.useDifferentEmail")}
            </button>
          </form>
        )}

        {errorMessage ? (
          <p className="form-error" role="alert">{errorMessage}</p>
        ) : null}
        <p className="auth-footnote">{t("auth.terms")}</p>
      </section>
    </main>
  );
}

function toSignInError(error: unknown, t: (k: TranslationKey) => string): string {
  if (error instanceof PracticeApiError && error.status === 429) {
    return t("auth.rateLimited");
  }
  return t("auth.genericError");
}
