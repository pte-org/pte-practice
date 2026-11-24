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
  /**
   * Reveal state held by the parent, for a form where one toggle uncovers every field at once. Left out, the
   * field keeps its own toggle.
   */
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  /** Hides this field's own toggle, for the second field of a pair the first one already uncovers. */
  withToggle?: boolean;
}

/** A password input with the reveal toggle, shared by the sign-in, first-password, reset and settings forms. */
export const PasswordField = ({
  label, value, onChange, autoComplete = "new-password", id, required = true, maxLength, withIcon = true,
  isVisible, onToggleVisibility, withToggle = true,
}: PasswordFieldProps): ReactElement => {
  const { t } = useTranslation();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [isOwnVisible, setIsOwnVisible] = useState(false);
  const shown = isVisible ?? isOwnVisible;
  const toggle = onToggleVisibility ?? (() => setIsOwnVisible((visible) => !visible));
  return (
    <>
      <label htmlFor={fieldId}>{label}</label>
      <div className="auth-field password-field">
        {withIcon ? <span className="auth-field-icon"><AppIcon name="lock" size={18} /></span> : null}
        <input id={fieldId} type={shown ? "text" : "password"} autoComplete={autoComplete} required={required}
          maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
        {withToggle ? (
          <button className="password-toggle" type="button" onClick={toggle}
            aria-label={shown ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={shown}>
            <AppIcon name={shown ? "eyeOff" : "eye"} size={18} />
          </button>
        ) : null}
      </div>
    </>
  );
};
