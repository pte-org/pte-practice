import type { PracticeSession } from "./contracts";

export type PracticeSessionPhase = "loading" | "overview" | "in_progress" | "submitting" | "exited" | "completed" | "error";

export interface PracticeSessionState {
  phase: PracticeSessionPhase;
  session: PracticeSession | null;
  error: string | null;
}

export type PracticeSessionAction =
  | { type: "loading" }
  | { type: "received"; session: PracticeSession }
  | { type: "mutation_started" }
  | { type: "mutation_succeeded"; session: PracticeSession }
  | { type: "exited"; session: PracticeSession }
  | { type: "failed"; message: string }
  | { type: "reset_error" };

export const INITIAL_PRACTICE_SESSION_STATE: PracticeSessionState = {
  phase: "loading",
  session: null,
  error: null,
};

export function practiceSessionReducer(
  state: PracticeSessionState,
  action: PracticeSessionAction,
): PracticeSessionState {
  switch (action.type) {
    case "loading":
      return { ...state, phase: "loading", error: null };
    case "received":
      return stateForSession(action.session, null);
    case "mutation_started":
      return { ...state, phase: "submitting", error: null };
    case "mutation_succeeded":
      return stateForSession(action.session, null);
    case "exited":
      return { phase: "exited", session: action.session, error: null };
    case "failed":
      return { ...state, phase: "error", error: action.message };
    case "reset_error":
      return { ...state, phase: phaseForSession(state.session), error: null };
  }
}

function stateForSession(session: PracticeSession, error: string | null): PracticeSessionState {
  return {
    phase: phaseForSession(session),
    session,
    error,
  };
}

function phaseForSession(session: PracticeSession | null): PracticeSessionPhase {
  if (!session) return "loading";
  if (session.status === "OVERVIEW") return "overview";
  if (session.status === "IN_PROGRESS") return "in_progress";
  if (session.status === "COMPLETED") return "completed";
  if (session.status === "DISCARDED" || session.status === "EXPIRED") return "exited";
  return "error";
}
