/** Product name split for the two-tone wordmark; a brand name, so it is not translated. */
export const BRAND_NAME = { prefix: "PTE", suffix: "Prep" } as const;

export const STUDENT_ROLE = "STUDENT";
export const ROLES_CLAIM = "roles";
/** Mirrors pte-api ChangePasswordRequest (@Size(min = 8)). */
export const MIN_PASSWORD_LENGTH = 8;
/** Mirrors pte-api ChangePasswordRequest (@MaxUtf8Bytes(72)); the input stops before the server has to refuse. */
export const MAX_PASSWORD_LENGTH = 72;

export const PASSWORD_CHANGED_NOTICE_MS = 1400;
