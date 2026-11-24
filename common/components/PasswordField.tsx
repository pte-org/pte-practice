"use client";

import { useId, useState, type ReactElement } from "react";
import { AppIcon } from "./AppIcon";
import { useTranslation } from "@/common/i18n";

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "current-password" while confirming who is typing, "new-password" for the replacement. */
  autoComplete?: "current-password" | "new-password";
  id?: string;
  required?: boolean;
  maxLength?: number;
  /** The lock in front of the input; off for plain forms that label their fields instead. */
  withIcon?: boolean;
}

/** A password input with the reveal toggle, shared by the sign-in, first-password and settings forms. */
export const PasswordField = ({
  label, value, onChange, autoComplete = "new-password", id, required = true, maxLength, withIcon = true,
}: PasswordFieldProps): ReactElement => {
  const { t } = useTranslation();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);
  return (
    <>
      <label htmlFor={fieldId}>{label}</label>
      <div className="auth-field password-field">
        {withIcon ? <span className="auth-field-icon"><AppIcon name="lock" size={18} /></span> : null}
        <input id={fieldId} type={isVisible ? "text" : "password"} autoComplete={autoComplete} required={required}
          maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
        <button className="password-toggle" type="button" onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={isVisible}>
          <AppIcon name={isVisible ? "eyeOff" : "eye"} size={18} />
        </button>
      </div>
    </>
  );
};
