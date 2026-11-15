import type { TranslationKey } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";

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
