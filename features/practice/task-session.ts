import type { PracticeProgressEntry } from "./contracts";

function activityTime(entry: PracticeProgressEntry): number {
  for (const value of [entry.lastActivityAt, entry.startedAt]) {
    const timestamp = Date.parse(value ?? "");
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

/** Resume only a live session, choosing the most recently used one for the task. */
export function latestActiveTaskSession(entries: PracticeProgressEntry[], taskCode: string): PracticeProgressEntry | undefined {
  return entries.filter((entry) => entry.taskCode === taskCode && entry.status === "IN_PROGRESS" && entry.sessionStatus === "IN_PROGRESS")
    .sort((a, b) => activityTime(b) - activityTime(a))[0];
}
