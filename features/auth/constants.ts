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

/** Sample content for the device preview. Task prompts stay in English, as in the exam. */
export const SHOWCASE_CONTENT = {
  laptopTask: "Multiple choice, multiple answers",
  laptopQuestion: "According to the passage, why did the Bauhaus style last?",
  laptopPassage: "The Bauhaus school was founded in 1919 and integrated art and craft…",
  laptopOptions: [
    { text: "It is the product of an industrial society.", correct: false },
    { text: "It unified more than one discipline.", correct: true },
    { text: "Its aim was mass appeal.", correct: false },
    { text: "Its efficiency remains appealing.", correct: true },
  ],
  phoneTask: "Read Aloud",
  phonePassage: "Climate change is one of the most pressing issues facing…",
} as const;
