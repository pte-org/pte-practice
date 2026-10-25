"use client";

import { type Dispatch, type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { createPracticeIdempotencyKey, type PracticeApiClient } from "../api";
import type { PracticeSession } from "../contracts";
import type { PracticeSessionAction, PracticeSessionPhase } from "../session-state";

const HEARTBEAT_INTERVAL_MS = 15_000;

/** What a command needs from the heartbeat so the two never race on the session version. */
export interface HeartbeatState {
  /** The heartbeat request in flight, if any; resolves to null when it failed. */
  pending: () => Promise<PracticeSession | null> | null;
  /** True after a heartbeat failed, so the next command reloads the session before it sends a version. */
  needsSync: () => boolean;
  markSynced: () => void;
  /** While a command runs the heartbeat skips its tick instead of bumping the version under it. */
  setBusy: (busy: boolean) => void;
}

interface UseHeartbeatOptions {
  api: PracticeApiClient;
  phase: PracticeSessionPhase;
  sessionRef: MutableRefObject<PracticeSession | null>;
  dispatch: Dispatch<PracticeSessionAction>;
  errorMessage: (reason: unknown) => string;
}

/** Pings the server every 15 s while a session is in progress so it stays alive and its version stays current. */
export function useHeartbeat({ api, phase, sessionRef, dispatch, errorMessage }: UseHeartbeatOptions): HeartbeatState {
  const inFlight = useRef(false);
  const promise = useRef<Promise<PracticeSession | null> | null>(null);
  const syncRequired = useRef(false);
  const mutationInFlight = useRef(false);
  const errorMessageRef = useRef(errorMessage);

  useEffect(() => {
    errorMessageRef.current = errorMessage;
  }, [errorMessage]);

  useEffect(() => {
    if (phase !== "in_progress") return;
    const timer = window.setInterval(() => {
      if (inFlight.current || mutationInFlight.current) return;
      const session = sessionRef.current;
      if (!session) return;
      inFlight.current = true;
      const request = api.heartbeat(session.publicId, session.version, createPracticeIdempotencyKey("heartbeat"))
        .then((next) => {
          sessionRef.current = next;
          dispatch({ type: "mutation_succeeded", session: next });
          return next;
        })
        .catch((reason: unknown) => {
          syncRequired.current = true;
          dispatch({ type: "failed", message: errorMessageRef.current(reason) });
          return null;
        });
      promise.current = request.finally(() => {
        inFlight.current = false;
        promise.current = null;
      });
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [api, dispatch, phase, sessionRef]);

  return useMemo<HeartbeatState>(() => ({
    pending: () => promise.current,
    needsSync: () => syncRequired.current,
    markSynced: () => { syncRequired.current = false; },
    setBusy: (busy) => { mutationInFlight.current = busy; },
  }), []);
}
