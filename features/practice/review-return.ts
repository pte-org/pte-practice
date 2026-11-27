import type { TranslationKey } from "@/common/i18n";
import { MOCK_TEST_KIND, PRACTICE_ROUTES } from "./constants";
import type { PracticeSession } from "./contracts";

/** Query parameter that names the page the review was opened from. */
export const REVIEW_FROM_PARAM = "from";

interface ReviewReturnTarget { href: string; label: TranslationKey }

/** Only these pages are valid return targets; anything else falls back to Home, so the param cannot redirect off-site. */
const REVIEW_RETURN_TARGETS: Readonly<Record<string, ReviewReturnTarget>> = {
  [PRACTICE_ROUTES.progress]: { href: PRACTICE_ROUTES.progress, label: "review.backToProgress" },
  [PRACTICE_ROUTES.studyPack]: { href: PRACTICE_ROUTES.studyPack, label: "review.backToStudyPack" },
  [PRACTICE_ROUTES.practiceTests]: { href: PRACTICE_ROUTES.practiceTests, label: "review.backToPracticeTests" },
};

const HOME_TARGET: ReviewReturnTarget = { href: PRACTICE_ROUTES.home, label: "review.back" };

export const reviewHref = (sessionId: string, from?: string): string => {
  const query = new URLSearchParams({ sessionId });
  if (from && REVIEW_RETURN_TARGETS[from]) query.set(REVIEW_FROM_PARAM, from);
  return `${PRACTICE_ROUTES.practiceReview}?${query.toString()}`;
};

export const reviewReturnTarget = (from: string | null): ReviewReturnTarget =>
  (from && REVIEW_RETURN_TARGETS[from]) || HOME_TARGET;

/**
 * The page a session was started from, so the review it opens sends the student back there and the rail keeps
 * lighting that page. A mock test belongs to Practice tests; every other session to Skill practice.
 */
export const sessionOrigin = (session: Pick<PracticeSession, "kind">): string =>
  (session.kind === MOCK_TEST_KIND ? PRACTICE_ROUTES.practiceTests : PRACTICE_ROUTES.studyPack);
