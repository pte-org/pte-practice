import type { PracticeSession } from "../contracts";
import { DEFAULT_MODE_PREFERENCE } from "../mode/mode-preference";
import { practiceSessionUrl, practiceSkillSessionUrl } from "../mode/practice-url";

/**
 * "Practise this again" after a finished session: the same task type or skill, untimed, default question count.
 * A mock test has no such action (it mixes every task type), and neither does a session missing that data.
 */
export function continueHref(session: Pick<PracticeSession, "kind" | "skillCode" | "taskCode">): string | null {
  const preference = { ...DEFAULT_MODE_PREFERENCE, timingMode: "UNTIMED" as const };
  if (session.kind === "SKILL" && session.skillCode) return practiceSkillSessionUrl(session.skillCode, preference);
  if ((session.kind === "TASK" || session.kind === null) && session.taskCode) {
    return practiceSessionUrl(session.taskCode, preference);
  }
  return null;
}

/** Mean of the scores that exist, rounded; null when nothing is scored yet. */
export function sessionAverageScore(scores: ReadonlyArray<number | null>): number | null {
  const present = scores.filter((score): score is number => score !== null && Number.isFinite(score));
  return present.length ? Math.round(present.reduce((sum, score) => sum + score, 0) / present.length) : null;
}
