"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductMark } from "@/features/icons/AppIcon";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { AUTH_TEXT } from "@/features/practice/constants";
import { savePracticeSession } from "@/features/practice/session-storage";

type SignInStep = "email" | "verification";

export default function SignInPage() {
  const router = useRouter();
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
      setErrorMessage(toSignInError(error));
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
      setErrorMessage(toSignInError(error));
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
        <p className="eyebrow">PTE Practice</p>
        <h1 id="sign-in-title">{AUTH_TEXT.title}</h1>
        <p className="auth-description">{AUTH_TEXT.description}</p>

        {step === "email" ? (
          <form className="auth-form" onSubmit={requestCode}>
            <label htmlFor="email">{AUTH_TEXT.emailLabel}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={AUTH_TEXT.emailPlaceholder}
              required
            />
            <button className="button button-primary button-wide" type="submit" disabled={isSubmitting}>
              {isSubmitting ? AUTH_TEXT.sending : AUTH_TEXT.continue}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyCode}>
            <label htmlFor="verification-code">{AUTH_TEXT.codeLabel}</label>
            <input
              id="verification-code"
              name="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder={AUTH_TEXT.codePlaceholder}
              required
            />
            <button className="button button-primary button-wide" type="submit" disabled={isSubmitting}>
              {isSubmitting ? AUTH_TEXT.verifying : AUTH_TEXT.verify}
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
              {AUTH_TEXT.useDifferentEmail}
            </button>
          </form>
        )}

        {errorMessage ? (
          <p className="form-error" role="alert">{errorMessage}</p>
        ) : null}
        <p className="auth-footnote">{AUTH_TEXT.terms}</p>
      </section>
    </main>
  );
}

function toSignInError(error: unknown): string {
  if (error instanceof PracticeApiError && error.status === 429) {
    return AUTH_TEXT.rateLimited;
  }
  return AUTH_TEXT.genericError;
}
