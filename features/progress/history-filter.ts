import type { PracticeProgressEntry } from "@/features/practice/contracts";

export type HistoryFilter = "ALL" | "IN_PROGRESS" | "COMPLETED" | "AWAITING_SCORE";

export const HISTORY_FILTERS: readonly HistoryFilter[] = ["ALL", "IN_PROGRESS", "COMPLETED", "AWAITING_SCORE"];

/** Rows shown at first and added by each "Xem thêm" press. */
export const HISTORY_PAGE_SIZE = 10;

export const isEntryInProgress = (entry: PracticeProgressEntry): boolean =>
  entry.status === "IN_PROGRESS" || entry.sessionStatus === "IN_PROGRESS";

/** A session the student still has to act on for AI scoring: unscored or failed answers. */
export const isAwaitingScore = (entry: PracticeProgressEntry): boolean =>
  entry.unscoredAiCount > 0 || entry.scoringFailedCount > 0;

export const matchesHistoryFilter = (entry: PracticeProgressEntry, filter: HistoryFilter): boolean => {
  switch (filter) {
    case "IN_PROGRESS": return isEntryInProgress(entry);
    case "COMPLETED": return !isEntryInProgress(entry);
    case "AWAITING_SCORE": return isAwaitingScore(entry);
    default: return true;
  }
};

export const historyFilterCounts = (entries: readonly PracticeProgressEntry[]): Record<HistoryFilter, number> => {
  const counts: Record<HistoryFilter, number> = { ALL: 0, IN_PROGRESS: 0, COMPLETED: 0, AWAITING_SCORE: 0 };
  for (const entry of entries) {
    for (const filter of HISTORY_FILTERS) {
      if (matchesHistoryFilter(entry, filter)) counts[filter] += 1;
    }
  }
  return counts;
};
