const CHAT_API_BASE = "/api/v1/student/chat";

export const CHAT_PATHS = {
  messages: `${CHAT_API_BASE}/messages`,
  quota: `${CHAT_API_BASE}/quota`,
  latestSession: `${CHAT_API_BASE}/sessions/latest`,
} as const;

/** Kept apart from `CHAT_PATHS` and `CHAT_ERROR_CODES` so those two stay exactly the first release's contract. */
export const CHAT_CONSENT_PATH = `${CHAT_API_BASE}/consent`;
export const CHAT_CONSENT_ERROR_CODE = "CHAT_CONSENT_REQUIRED";

/**
 * The privacy notice the student accepts before chatting. It must equal the server's
 * `ChatConstants.CONSENT_POLICY_VERSION`: a mismatch is refused, and changing the notice means changing both,
 * which asks every student again.
 */
export const CHAT_CONSENT_POLICY_VERSION = "2026-10-29";

/** Mirrors the server limit (`chat.ai.max-input-chars`); the server stays the authority. */
export const CHAT_MAX_INPUT_CHARS = 1000;

/** Show a "running low" notice when this many questions or fewer remain. */
export const CHAT_WARNING_THRESHOLD = 3;

/** Remembers, per browser tab, that the panel was open when the student moved to the next question. */
export const CHAT_OPEN_STORAGE_KEY = "pte-practice:chat-open";

/** At and below this width the panel covers the page and behaves as a dialog; keep in step with chat.css. */
export const CHAT_NARROW_QUERY = "(max-width: 960px)";

export const CHAT_ERROR_CODES = {
  quotaExceeded: "CHAT_QUOTA_EXCEEDED",
  inFlight: "CHAT_REQUEST_IN_FLIGHT",
  busy: "CHAT_BUSY",
  sessionNotFound: "CHAT_SESSION_NOT_FOUND",
  invalidRequest: "CHAT_INVALID_REQUEST",
} as const;

export const CHAT_INVALID_RESPONSE_CODE = "CHAT_INVALID_RESPONSE";

/**
 * Task types the server accepts as chat context. Anything else is dropped before sending, because the
 * value ends up in the model prompt and the server rejects free text.
 */
export const CHAT_TASK_TYPES: readonly string[] = [
  "PERSONAL_INTRODUCTION",
  "READ_ALOUD",
  "REPEAT_SENTENCE",
  "DESCRIBE_IMAGE",
  "RE_TELL_LECTURE",
  "ANSWER_SHORT_QUESTION",
  "RESPOND_TO_A_SITUATION",
  "SUMMARIZE_GROUP_DISCUSSION",
  "SUMMARIZE_WRITTEN_TEXT",
  "WRITE_ESSAY",
  "MC_READING_SINGLE",
  "MC_READING_MULTIPLE",
  "RE_ORDER_PARAGRAPHS",
  "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
  "FILL_IN_THE_BLANKS_DROPDOWN",
  "SUMMARIZE_SPOKEN_TEXT",
  "MC_LISTENING_SINGLE",
  "MC_LISTENING_MULTIPLE",
  "FILL_IN_THE_BLANKS_TYPE_IN",
  "HIGHLIGHT_CORRECT_SUMMARY",
  "SELECT_MISSING_WORD",
  "HIGHLIGHT_INCORRECT_WORDS",
  "WRITE_FROM_DICTATION",
];
