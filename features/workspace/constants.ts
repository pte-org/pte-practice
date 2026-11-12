import { PRACTICE_ROUTES } from "@/features/practice/constants";
import type { PracticeProgress } from "@/features/practice/contracts";

export const WORKSPACE_ROUTES: readonly string[] = [
  PRACTICE_ROUTES.home, PRACTICE_ROUTES.practiceTests, PRACTICE_ROUTES.studyPack, PRACTICE_ROUTES.progress,
];

export const WORKSPACE_PROGRESS_STALE_MS = 30_000;

export const isWorkspaceRoute = (pathname: string): boolean => WORKSPACE_ROUTES.includes(pathname);

export const EMPTY_WORKSPACE_PROGRESS: PracticeProgress = {
  entries: [], totalSessions: 0, completedSessions: 0, answeredItems: 0, totalItems: 0, generatedAt: null, hasMore: false,
};

/** Pages that wear the studio chrome and background without the dashboard panels: the workspace plus answer review. */
export const isStudioRoute = (pathname: string): boolean =>
  isWorkspaceRoute(pathname) || pathname === PRACTICE_ROUTES.practiceReview;
