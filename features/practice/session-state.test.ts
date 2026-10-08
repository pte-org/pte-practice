import { describe, expect, it } from "vitest";
import { INITIAL_PRACTICE_SESSION_STATE, practiceSessionReducer } from "./session-state";
import type { PracticeSession } from "./contracts";

const session = (status: PracticeSession["status"]): PracticeSession => ({
  publicId: "session-1",
  sourceType: "PRACTICE",
  productCode: "PTE_CORE_PRACTICE",
  title: "PTE Core Practice",
  organizationId: "org-1",
  catalogVersion: "2026.10",
  timeLimitSeconds: 3600,
  status,
  version: 1,
  startedAt: null,
  deadlineAt: null,
  completedAt: null,
  discardedAt: null,
  saveAndExitAvailable: true,
  canAdvance: true,
  nextAction: "NEXT",
  answeredItemCount: 0,
  totalItemCount: 1,
  sections: [],
  currentTask: null,
});

describe("practiceSessionReducer", () => {
  it("keeps the overview separate from the first question", () => {
    const state = practiceSessionReducer(INITIAL_PRACTICE_SESSION_STATE, {
      type: "received",
      session: session("OVERVIEW"),
    });
    expect(state.phase).toBe("overview");
    expect(state.session?.currentTask).toBeNull();
  });

  it("moves to the next server-owned state after a mutation", () => {
    const overview = practiceSessionReducer(INITIAL_PRACTICE_SESSION_STATE, {
      type: "received",
      session: session("OVERVIEW"),
    });
    const submitting = practiceSessionReducer(overview, { type: "mutation_started" });
    expect(submitting.phase).toBe("submitting");
    const inProgress = practiceSessionReducer(submitting, {
      type: "mutation_succeeded",
      session: session("IN_PROGRESS"),
    });
    expect(inProgress.phase).toBe("in_progress");
  });

  it("represents discarded sessions as exited rather than retryable questions", () => {
    const state = practiceSessionReducer(INITIAL_PRACTICE_SESSION_STATE, {
      type: "received",
      session: session("DISCARDED"),
    });
    expect(state.phase).toBe("exited");
  });
});
