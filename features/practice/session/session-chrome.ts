import type { PracticeSession } from "../contracts";

export interface SessionParts {
  segments: { done: boolean; current: boolean }[];
  /** 1-based number of the current part. */
  partNumber: number;
  partCount: number;
}

/**
 * The parts of a session for the header ("Part 2 of 3") and the segmented bar: one part per skill the session
 * covers, in the order the session runs them; a single-skill session has one part.
 */
export function sessionParts(session: Pick<PracticeSession, "sections" | "currentTask" | "status">): SessionParts {
  const codes = session.sections.map((section) => section.code);
  const partCount = Math.max(1, codes.length);
  const currentIndex = session.status === "COMPLETED" ? partCount
    : Math.max(0, codes.indexOf(session.currentTask?.section ?? ""));
  return {
    segments: Array.from({ length: partCount }, (_, index) => ({ done: index < currentIndex, current: index === currentIndex })),
    partNumber: Math.min(partCount, currentIndex + 1),
    partCount,
  };
}

/** Leaving now would lose a recording that is still being made or uploaded. */
export function shouldWarnOnLeave(recorderBusy: boolean): boolean {
  return recorderBusy;
}
