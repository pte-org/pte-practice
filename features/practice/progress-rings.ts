import type { PracticeCatalogSection } from "./catalog-contracts";
import { canStartPractice } from "./catalog-contracts";

export interface SkillReadiness {
  ready: number;
  total: number;
}

/** How many task types of a skill can be practised now, out of how many the skill has. */
export function skillReadiness(section: PracticeCatalogSection | undefined, unlocked: boolean): SkillReadiness {
  const tasks = section?.taskTypes ?? [];
  const ready = unlocked ? tasks.filter((task) => canStartPractice("UNLOCKED", task)).length : 0;
  return { ready, total: tasks.length };
}

export interface LatestSessionRing {
  variant: "progress" | "empty";
  value: number;
  max: number;
}

/** The ring for the latest session's answered/total items; with no session there is nothing to fill. */
export function latestSessionRing(entry: { answeredItemCount: number; totalItemCount: number } | null): LatestSessionRing {
  if (!entry || entry.totalItemCount <= 0) return { variant: "empty", value: 0, max: 0 };
  return { variant: "progress", value: entry.answeredItemCount, max: entry.totalItemCount };
}
