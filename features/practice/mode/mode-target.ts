import type { PracticeCatalogSection, PracticeCatalogTask } from "../catalog-contracts";
import { canStartPractice } from "../catalog-contracts";

/**
 * What the mode dialog is starting: one task type or every task type of a skill (untimed, the student picks how many
 * questions), or a full mock test (fixed length, the student picks timed or untimed). For a mock, `code` is its id.
 */
export interface ModeTarget {
  kind: "task" | "skill" | "mock";
  code: string;
  title: string;
  timedAvailable: boolean;
  /** Mock test only: abandon the unfinished attempt and start again. */
  restart?: boolean;
}

export function mockTarget(publicId: string, title: string, restart = false): ModeTarget {
  return { kind: "mock", code: publicId, title, timedAvailable: true, restart };
}

export function taskTarget(task: PracticeCatalogTask): ModeTarget {
  return { kind: "task", code: task.code, title: task.displayName, timedAvailable: task.timedAvailable };
}

/** The task types of a skill that can be started now. */
export function runnableTasks(section: PracticeCatalogSection): PracticeCatalogTask[] {
  return section.taskTypes.filter((task) => canStartPractice("UNLOCKED", task));
}

/** A skill can be timed only when every task type it would draw from can be paced by the Score Template. */
export function skillTarget(section: PracticeCatalogSection, title: string): ModeTarget {
  const tasks = runnableTasks(section);
  return {
    kind: "skill",
    code: section.code,
    title,
    timedAvailable: tasks.length > 0 && tasks.every((task) => task.timedAvailable),
  };
}

/** Key under which the student's last choice is remembered; skills never collide with task type codes. */
export function preferenceKey(target: Pick<ModeTarget, "kind" | "code">): string {
  return target.kind === "task" ? target.code : `${target.kind}:${target.code}`;
}
