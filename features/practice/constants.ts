import { COMMON_API_ERROR_TEXT, COMMON_TEXT } from "../../common/constants";
import type { IconName } from "../../common/components";
import type { CatalogAvailability } from "./contracts";

export const API_PATHS = {
  requestChallenge: "/api/v1/auth/practice/request",
  verifyChallenge: "/api/v1/auth/practice/verify",
  refreshToken: "/api/v1/auth/refresh",
  entitlement: "/api/v1/student/practice/entitlement",
  catalog: "/api/v1/student/practice/catalog",
  progress: "/api/v1/student/practice/progress",
  practiceSessions: "/api/v1/student/practice/sessions",
  mediaObjects: "/api/v1/objects",
} as const;

export const PRACTICE_ROUTES = {
  home: "/",
  practiceTests: "/practice-tests",
  studyPack: "/study-pack",
  progress: "/progress",
  signIn: "/sign-in",
  practiceSession: "/practice-tests/session",
} as const;

export const NAV_ITEMS: ReadonlyArray<{ href: string; label: string; icon: IconName }> = [
  { href: PRACTICE_ROUTES.home, label: "Home", icon: "home" },
  { href: PRACTICE_ROUTES.practiceTests, label: "Practice tests", icon: "practice" },
  { href: PRACTICE_ROUTES.studyPack, label: "Study-Pack", icon: "studyPack" },
  { href: PRACTICE_ROUTES.progress, label: "Progress", icon: "progress" },
] as const;

export const UI_TEXT = {
  ...COMMON_TEXT,
  accessChecking: "Checking practice access",
  accessUnlocked: "Practice unlocked",
  accessLocked: "Practice locked",
  accessUnavailable: "Practice unavailable",
  accessUnknown: "Practice access is unavailable right now. Practice actions remain locked.",
  availableAction: "Start practice",
  catalogError: "The practice catalog is unavailable. Preview cards remain locked until it loads.",
  sessionStarting: "Preparing your practice session...",
  sessionLoading: "Loading your practice session...",
  sessionOverview: "Review the session before you begin.",
  sessionNext: "Next",
  sessionSubmit: "Submit answer",
  sessionSkip: "Skip",
  sessionSaveExit: "Save and exit",
  sessionExitSaved: "Your progress has been saved.",
  sessionProgressSaved: "Progress saved",
  sessionCompleted: "Practice session complete.",
  sessionUnsupported: "This task is visible, but its interactive runtime is not available yet.",
  sessionConflict: "This session changed in another tab. Reload to continue from the latest state.",
  sessionExpired: "This practice session has expired.",
  sessionError: "We could not load this practice session. Please try again.",
  sessionConfidence: "How confident are you in this answer?",
  confidenceHintTitle: "Rate your confidence",
  confidenceHintDescription: "Your confidence rating is saved with this response to help you understand your learning patterns. It does not change your score.",
  confidenceHintDismiss: "Got it",
  sessionNoAnswer: "Choose or enter an answer before submitting.",
  progressEmptyTitle: "Your progress will appear here",
  progressEmptyDescription: "Complete a practice session to start building your history.",
  progressLoading: "Loading your progress…",
  progressError: "We could not load your progress. Please try again.",
  progressNoScore: "Completed · awaiting scoring",
  progressInProgress: "In progress",
  progressScore: "Score",
  progressHeading: "Get started, Student 🚀",
  progressLoadedDescription: "Your latest practice activity is shown below.",
  progressMetricSessions: "Practice sessions",
  progressMetricCompleted: "Completed",
  progressMetricResponses: "Responses",
  progressMetricTasksReviewed: "Tasks reviewed",
  progressSpeaking: "Speaking",
  progressSpeakingProficiency: "Speaking proficiency",
  progressSpeakingItems: "Speaking items",
  progressNoTaskTypes: "No task types",
  progressTaskTypes: "task types",
  progressNoResponse: "No response yet",
  progressSessionHistoryAvailable: "Session-level history available",
  progressCompleteTask: "Complete a practice task to see your latest result.",
  progressReadOnlyNote: "Progress is read-only. Historical results will stay available independently of current practice access.",
  progressScoringUnavailable: "Scoring unavailable",
  progressNotStarted: "Not started",
  progressRecentActivity: "Recent activity",
  progressHistoryTitle: "Practice history",
  progressLatestSessions: "Showing latest 100",
  progressNoValue: "—",
  progressSession: "session",
  progressSessions: "sessions",
  progressResponses: "responses",
  progressHighConfidence: "high confidence",
} as const;

export const API_ERROR_TEXT = {
  ...COMMON_API_ERROR_TEXT,
  invalidCatalog: "The practice catalog response was invalid.",
  invalidSession: "The practice session response was invalid.",
} as const;

export const AUTH_TEXT = {
  title: "Continue with email",
  description: "Use your email to receive a one-time verification code.",
  emailLabel: "Email address",
  emailPlaceholder: "you@example.com",
  codeLabel: "Verification code",
  codePlaceholder: "Enter 6 digits",
  continue: "Continue",
  sending: "Sending…",
  verify: "Verify and continue",
  verifying: "Verifying…",
  useDifferentEmail: "Use a different email",
  terms: "By continuing, you agree to the PTE Practice terms and privacy policy.",
  genericError: "We could not verify that request. Please try again.",
  rateLimited: "Too many requests. Please wait a moment and try again.",
} as const;

export const STUDY_PACKS = [
  {
    id: "speaking-foundation",
    title: "Speaking foundation",
    description: "Build a steady routine across speaking task types.",
    icon: "mic",
  },
  {
    id: "writing-toolkit",
    title: "Writing toolkit",
    description: "Review structures and practice prompts in one place.",
    icon: "writing",
  },
  {
    id: "reading-listening",
    title: "Reading & Listening",
    description: "Strengthen comprehension with short focused sessions.",
    icon: "reading",
  },
] as const;

export const PREVIEW_TASKS = [
  { code: "PERSONAL_INTRODUCTION", displayName: "Personal Introduction", section: "SPEAKING", scored: false, availability: "VISIBLE", unavailableReason: null },
  { code: "READ_ALOUD", displayName: "Read Aloud", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "REPEAT_SENTENCE", displayName: "Repeat Sentence", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "DESCRIBE_IMAGE", displayName: "Describe Image", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "RE_TELL_LECTURE", displayName: "Re-tell Lecture", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "ANSWER_SHORT_QUESTION", displayName: "Answer Short Question", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "RESPOND_TO_A_SITUATION", displayName: "Respond to a Situation", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "SUMMARIZE_GROUP_DISCUSSION", displayName: "Summarize Group Discussion", section: "SPEAKING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "SUMMARIZE_WRITTEN_TEXT", displayName: "Summarize Written Text", section: "WRITING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "WRITE_EMAIL", displayName: "Write Email", section: "WRITING", scored: true, availability: "UNAVAILABLE", unavailableReason: "UNSUPPORTED_RUNTIME" },
  { code: "WRITE_ESSAY", displayName: "Write Essay", section: "WRITING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "MC_READING_SINGLE", displayName: "Multiple-choice Reading (Single)", section: "READING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "MC_READING_MULTIPLE", displayName: "Multiple-choice Reading (Multiple)", section: "READING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "RE_ORDER_PARAGRAPHS", displayName: "Re-order Paragraphs", section: "READING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "FILL_IN_THE_BLANKS_DRAG_AND_DROP", displayName: "Fill in the Blanks (Drag and Drop)", section: "READING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "FILL_IN_THE_BLANKS_DROPDOWN", displayName: "Fill in the Blanks (Dropdown)", section: "READING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "SUMMARIZE_SPOKEN_TEXT", displayName: "Summarize Spoken Text", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "MC_LISTENING_SINGLE", displayName: "Multiple-choice Listening (Single)", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "MC_LISTENING_MULTIPLE", displayName: "Multiple-choice Listening (Multiple)", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "FILL_IN_THE_BLANKS_TYPE_IN", displayName: "Fill in the Blanks (Type In)", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "HIGHLIGHT_CORRECT_SUMMARY", displayName: "Highlight Correct Summary", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "SELECT_MISSING_WORD", displayName: "Select Missing Word", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "HIGHLIGHT_INCORRECT_WORDS", displayName: "Highlight Incorrect Words", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
  { code: "WRITE_FROM_DICTATION", displayName: "Write From Dictation", section: "LISTENING", scored: true, availability: "VISIBLE", unavailableReason: null },
] satisfies ReadonlyArray<{
  code: string;
  displayName: string;
  section: string;
  scored: boolean;
  availability: CatalogAvailability;
  unavailableReason: string | null;
}>;

export const PRACTICE_SECTION_ORDER = ["SPEAKING", "WRITING", "READING", "LISTENING"] as const;

export const PRACTICE_TASK_ORDER = PREVIEW_TASKS.map((task) => task.code) as ReadonlyArray<string>;
