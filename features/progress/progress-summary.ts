import type { PracticeProgress } from "@/features/practice/contracts";

export interface ProgressMetrics {
  sessions: number;
  completed: number;
  answered: number;
  /** Mean of the sessions' average scores; null while no session has a score. */
  averageScore: number | null;
}

export function progressMetrics(progress: PracticeProgress): ProgressMetrics {
  const scores = progress.entries.map((entry) => entry.score).filter((score): score is number => score !== null);
  return {
    sessions: progress.totalSessions,
    completed: progress.completedSessions,
    answered: progress.answeredItems,
    averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
  };
}
