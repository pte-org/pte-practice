"use client";

import { type Dispatch, useEffect, useReducer } from "react";
import {
  initialTimedState, timedReducer, type InitialTimedOptions, type TimedEvent, type TimedState,
} from "./timed-phase";

/** True when the page has had no user gesture yet (first load, reload), so audio would be blocked until one happens. */
export function needsStartGate(): boolean {
  return typeof navigator === "undefined" || !navigator.userActivation?.hasBeenActive;
}

type TimedOptions = Omit<InitialTimedOptions, "needsGate">;

/**
 * Runs the timed state machine for one question: starts it once, and wakes it at the current deadline (and when the
 * tab becomes visible again) so a throttled background tab cannot stretch the question.
 */
export function useTimedPhase(options: TimedOptions): { state: TimedState; dispatch: Dispatch<TimedEvent> } {
  const [state, dispatch] = useReducer(timedReducer, options, (initial) =>
    initialTimedState({ ...initial, needsGate: needsStartGate() }));

  useEffect(() => {
    dispatch({ type: "START", now: Date.now() });
  }, []);

  const { deadlineMs } = state;
  useEffect(() => {
    if (deadlineMs === null) return;
    const wake = () => dispatch({ type: "TICK", now: Date.now() });
    const timer = window.setTimeout(wake, Math.max(0, deadlineMs - Date.now()));
    const onVisible = () => { if (document.visibilityState === "visible") wake(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deadlineMs]);

  return { state, dispatch };
}
