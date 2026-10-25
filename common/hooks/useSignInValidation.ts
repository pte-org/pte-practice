"use client";

import { useCallback, useState } from "react";

/**
 * Ported from `pte-web/packages/ui/src/hooks/useSignInValidation.ts` (@pte/ui), same API. Practice signs in with
 * roster usernames, not emails, so the email rule is behind `requireEmail` (the @pte/ui behaviour is `true`).
 */
export type SignInField = "username" | "password";
export type SignInErrors = Partial<Record<SignInField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignInValidationMessages {
  usernameRequired: string;
  usernameInvalidEmail: string;
  passwordRequired: string;
}

export interface SignInValues {
  username: string;
  password: string;
}

export const validateSignInField = (
  field: SignInField,
  value: string,
  messages: SignInValidationMessages,
  requireEmail = true,
): string | undefined => {
  if (field === "username") {
    const username = value.trim();
    if (!username) return messages.usernameRequired;
    if (requireEmail && !EMAIL_PATTERN.test(username)) return messages.usernameInvalidEmail;
    return undefined;
  }
  return value.length === 0 ? messages.passwordRequired : undefined;
};

export interface SignInValidation {
  errors: SignInErrors;
  onBlur: (field: SignInField, value: string) => void;
  onChange: (field: SignInField, value: string) => void;
  validateAll: (values: SignInValues) => SignInErrors;
}

export const useSignInValidation = (messages: SignInValidationMessages, requireEmail = true): SignInValidation => {
  const [errors, setErrors] = useState<SignInErrors>({});
  const [touched, setTouched] = useState<Partial<Record<SignInField, boolean>>>({});

  const check = useCallback((field: SignInField, value: string): string | undefined => {
    const error = validateSignInField(field, value, messages, requireEmail);
    setErrors((previous) => ({ ...previous, [field]: error }));
    return error;
  }, [messages, requireEmail]);

  const onBlur = useCallback((field: SignInField, value: string): void => {
    setTouched((previous) => ({ ...previous, [field]: true }));
    check(field, value);
  }, [check]);

  const onChange = useCallback((field: SignInField, value: string): void => {
    if (touched[field] || errors[field]) check(field, value);
  }, [check, errors, touched]);

  const validateAll = useCallback((values: SignInValues): SignInErrors => {
    setTouched({ username: true, password: true });
    return { username: check("username", values.username), password: check("password", values.password) };
  }, [check]);

  return { errors, onBlur, onChange, validateAll };
};
