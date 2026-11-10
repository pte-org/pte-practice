/** Product name split for the two-tone wordmark; a brand name, so it is not translated. */
export const BRAND_NAME = { prefix: "PTE", suffix: "Prep" } as const;

export const STUDENT_ROLE = "STUDENT";
export const ROLES_CLAIM = "roles";
/** Mirrors pte-api ChangePasswordRequest (@Size(min = 8)). */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Local test accounts for the quick-fill buttons, as `account:password` pairs separated by `;`.
 * Only read outside production builds; never put real student credentials here.
 */
export const DEV_TEST_ACCOUNTS_ENV = process.env.NEXT_PUBLIC_DEV_TEST_ACCOUNTS ?? "";
export const IS_DEV_BUILD = process.env.NODE_ENV !== "production";
export const PASSWORD_CHANGED_NOTICE_MS = 1400;
