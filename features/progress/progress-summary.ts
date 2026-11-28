import type { PracticeProgress } from "@/features/practice/contracts";
import { isEntryInProgress } from "./history-filter";

export interface ProgressMetrics {
  sessions: number;
  completed: number;
  answered: number;
  /** Mean of the sessions' average scores; null while no session has a score. */
  averageScore: number | null;
}

export function progressMetrics(progress: PracticeProgress): ProgressMetrics {
  // A session still in progress only has the average of the items answered so far.
  const scores = progress.entries
    .filter((entry) => !isEntryInProgress(entry))
    .map((entry) => entry.score)
    .filter((score): score is number => score !== null);
  return {
    sessions: progress.totalSessions,
    completed: progress.completedSessions,
    answered: progress.answeredItems,
    averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
  };
}
