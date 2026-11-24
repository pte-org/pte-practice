"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { PasswordField, useToast } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { createPracticeApiClient } from "@/features/practice/api";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { AuthShell } from "./AuthShell";
import { FORGOT_PASSWORD_PARAM } from "./forgot-password-param";
import { MAX_PASSWORD_LENGTH } from "./constants";
import { newPasswordError } from "./password-rules";

type LinkState = "checking" | "usable" | "unusable";

/** The page a reset e-mail opens: it checks the link first, then takes the new password. */
export const ResetPasswordView = (): ReactElement => {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const token = useSearchParams().get("token")?.trim() ?? "";
  // A missing token is unusable from the start, so the effect never has to set that state itself.
  const [linkState, setLinkState] = useState<LinkState>(token ? "checking" : "unusable");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    createPracticeApiClient().isResetTokenUsable(token)
      .then((usable) => { if (!cancelled) setLinkState(usable ? "usable" : "unusable"); })
      .catch(() => { if (!cancelled) setLinkState("unusable"); });
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const ruleError = newPasswordError(newPassword, confirmation);
    if (ruleError) {
      setErrorKey(ruleError);
      return;
    }
    setErrorKey(null);
    setIsSubmitting(true);
    try {
      await createPracticeApiClient().confirmPasswordReset(token, newPassword);
      showToast(t("auth.resetDone"), { tone: "success" });
      router.replace(PRACTICE_ROUTES.signIn);
    } catch {
      // A link only works once and expires, so a refusal here means a new link is needed.
      setErrorKey("auth.resetFailed");
      setLinkState("unusable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const newLinkHref = `${PRACTICE_ROUTES.signIn}?${FORGOT_PASSWORD_PARAM}=1`;
  const footer = (href: string, label: string): ReactElement => (
    <button className="text-button sign-in-back" type="button" onClick={() => router.replace(href)}>{label}</button>
  );

  if (linkState === "checking") {
    return (
      <AuthShell>
        <div>
          <h1 className="sign-in-step-title">{t("auth.resetLinkCheckingTitle")}</h1>
          <p className="sign-in-lead">{t("auth.resetLinkChecking")}</p>
        </div>
      </AuthShell>
    );
  }

  if (linkState === "unusable") {
    return (
      <AuthShell>
        <div>
          <h1 className="sign-in-step-title">{t("auth.resetLinkInvalidTitle")}</h1>
          <p className="sign-in-lead">{errorKey ? t(errorKey) : t("auth.resetLinkInvalidDescription")}</p>
        </div>
        {footer(newLinkHref, t("auth.requestNewResetLink"))}
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <h1 className="sign-in-step-title">{t("auth.resetPasswordTitle")}</h1>
        <p className="sign-in-lead">{t("auth.resetPasswordDescription")}</p>
      </div>
      {errorKey ? <p className="form-error" role="alert">{t(errorKey)}</p> : null}
      <form className="auth-form sign-in-form" noValidate onSubmit={(event) => void submit(event)}>
        <PasswordField id="reset-new-password" label={t("auth.newPasswordLabel")} maxLength={MAX_PASSWORD_LENGTH}
          value={newPassword} onChange={setNewPassword}
          isVisible={isVisible} onToggleVisibility={() => setIsVisible((shown) => !shown)} />
        <PasswordField id="reset-confirm-password" label={t("auth.confirmPasswordLabel")} withToggle={false}
          maxLength={MAX_PASSWORD_LENGTH} value={confirmation} onChange={setConfirmation} isVisible={isVisible} />
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("auth.changingPassword") : t("auth.resetPasswordSubmit")}
        </button>
      </form>
      {footer(PRACTICE_ROUTES.signIn, t("auth.backToSignIn"))}
    </AuthShell>
  );
};
