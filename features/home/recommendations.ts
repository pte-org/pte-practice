import type { TranslationKey } from "@/common/i18n";
import type { MockTest } from "@/features/mockTests/mock-test-contracts";
import type { PracticeProgressEntry } from "@/features/practice/contracts";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { practiceMockTestUrl } from "@/features/practice/mode/practice-url";
import { sessionDisplayName } from "@/features/practice/presentation";

export const MAX_RECOMMENDATIONS = 6;

/** What a card does: open a URL (resume), or start a mock test, which first asks timed or untimed. */
export type RecommendationTarget = { type: "href"; href: string } | { type: "mock"; publicId: string; title: string };

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  itemCount: number | null;
  minutes: number | null;
  progress: { done: number; total: number };
  action: "continue" | "start";
  target: RecommendationTarget;
}

/**
 * Cards for "Recommended for you": practice the student left unfinished first (newest first), then unfinished mock
 * tests, then mock tests not started yet in test order; at most six.
 */
export function buildRecommendations(mockTests: MockTest[], entries: PracticeProgressEntry[],
  taskName: (code: string) => string, t: (key: TranslationKey) => string): Recommendation[] {
  const inProgress = (done: number, total: number) => t("presentation.inProgress")
    .replace("{done}", String(done)).replace("{total}", String(total));

  const sessions: Recommendation[] = entries
    .filter((entry) => entry.status === "IN_PROGRESS" && entry.kind !== "MOCK_TEST")
    .map((entry) => ({
      id: `session:${entry.sessionPublicId}`,
      title: sessionDisplayName(entry, taskName, t),
      description: inProgress(entry.answeredItemCount, entry.totalItemCount),
      itemCount: null,
      minutes: null,
      progress: { done: entry.answeredItemCount, total: entry.totalItemCount },
      action: "continue",
      target: { type: "href", href: `${PRACTICE_ROUTES.practiceSession}?sessionId=${entry.sessionPublicId}` },
    }));

  const unfinishedMocks: Recommendation[] = [];
  const newMocks: Recommendation[] = [];
  [...mockTests].sort((left, right) => left.sequenceNo - right.sequenceNo).forEach((test) => {
    const attempt = test.latestAttempt;
    const unfinished = attempt?.status === "OVERVIEW" || attempt?.status === "IN_PROGRESS";
    const card: Recommendation = {
      id: `mock:${test.publicId}`,
      title: test.title,
      description: unfinished && attempt
        ? inProgress(attempt.answeredItemCount, attempt.totalItemCount) : t("presentation.mockDescription"),
      itemCount: test.itemCount,
      minutes: test.estimatedMinutes,
      progress: unfinished && attempt
        ? { done: attempt.answeredItemCount, total: attempt.totalItemCount } : { done: 0, total: test.itemCount },
      action: unfinished ? "continue" : "start",
      target: unfinished
        ? { type: "href", href: practiceMockTestUrl(test.publicId) }
        : { type: "mock", publicId: test.publicId, title: test.title },
    };
    (unfinished ? unfinishedMocks : newMocks).push(card);
  });

  return [...sessions, ...unfinishedMocks, ...newMocks].slice(0, MAX_RECOMMENDATIONS);
}
