import type { TranslationKey } from "@/common/i18n";
import type { MockTest } from "@/features/mockTests/mock-test-contracts";
import type { PracticeCatalogSection, PracticeProgressEntry } from "@/features/practice/contracts";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { DASHBOARD_RESUME_PREVIEW_ITEMS } from "./constants";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { practiceMockTestUrl } from "@/features/practice/mode/practice-url";
import { sessionDisplayName } from "@/features/practice/presentation";

export const MAX_RECOMMENDATIONS = 6;

/** What a card does: open a URL (resume), or start a mock test, which first asks timed or untimed. */
export type RecommendationTarget = { type: "href"; href: string } | { type: "mock"; publicId: string; title: string };

export interface Recommendation {
  id: string;
  taskCode?: string;
  title: string;
  description: string;
  itemCount: number | null;
  minutes: number | null;
  progress: { done: number; total: number };
  action: "continue" | "start";
  target: RecommendationTarget;
}

export const selectResumeCards = (cards: Recommendation[], sections: PracticeCatalogSection[],
  expanded: boolean, selected: string): Recommendation[] => {
  if (!expanded) return cards.slice(1, DASHBOARD_RESUME_PREVIEW_ITEMS);
  if (selected === "ALL") return cards;
  const group = orderCatalogSections(sections).find((section) => section.code === selected);
  const codes = new Set(group?.taskTypes.map((task) => task.code));
  return cards.filter((card) => card.taskCode && codes.has(card.taskCode));
};

/** Home resumes one latest single-task session per task type; mixed-skill sessions stay in history. */
export const buildTaskRecommendations = (entries: PracticeProgressEntry[],
  taskName: (code: string) => string, t: (key: TranslationKey) => string): Recommendation[] => {
  const activityTime = (entry: PracticeProgressEntry): number => {
    const time = Date.parse(entry.lastActivityAt ?? entry.startedAt ?? "");
    return Number.isFinite(time) ? time : 0;
  };
  const seen = new Set<string>();
  return entries.filter((entry) => entry.status === "IN_PROGRESS" && entry.sessionStatus === "IN_PROGRESS"
      && entry.kind !== "MOCK_TEST" && entry.taskCode)
    .sort((left, right) => activityTime(right) - activityTime(left))
    .flatMap((entry): Recommendation[] => {
      const code = entry.taskCode;
      if (!code || seen.has(code)) return [];
      seen.add(code);
      return [{
        id: `session:${entry.sessionPublicId}`, taskCode: code, title: taskName(code),
        description: t("presentation.inProgress").replace("{done}", String(entry.answeredItemCount))
          .replace("{total}", String(entry.totalItemCount)),
        itemCount: entry.totalItemCount, minutes: null,
        progress: { done: entry.answeredItemCount, total: entry.totalItemCount }, action: "continue",
        target: { type: "href", href: `${PRACTICE_ROUTES.practiceSession}?sessionId=${encodeURIComponent(entry.sessionPublicId)}` },
      }];
    });
};

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
