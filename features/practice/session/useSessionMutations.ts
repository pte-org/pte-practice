"use client";

import { type Dispatch, type MutableRefObject, useCallback, useRef, useState } from "react";
import { createPracticeIdempotencyKey, PracticeApiError, type PracticeApiClient } from "../api";
import type { PracticeSession } from "../contracts";
import type { PracticeSessionAction } from "../session-state";
import { runInBackground, type BackgroundResult } from "./background-mutation";
import type { HeartbeatState } from "./useHeartbeat";

interface UseSessionMutationsOptions {
  api: PracticeApiClient;
  dispatch: Dispatch<PracticeSessionAction>;
  sessionRef: MutableRefObject<PracticeSession | null>;
  heartbeat: HeartbeatState;
  hydrateDraft: (session: PracticeSession) => void;
  errorMessage: (reason: unknown) => string;
  /** Message for the case where a command is issued before any session was loaded. */
  unavailableMessage: string;
}

type SessionAction = (idempotencyKey: string) => Promise<PracticeSession>;

/**
 * Commands that change the session. Each scope keeps one idempotency key until it succeeds, so a retry of the same
 * command replays safely. `runMutation` drives the whole screen (submitting → success/error card);
 * `runBackgroundMutation` updates the session without touching the phase, for work that must not lose what the
 * student has in memory, such as saving a recording.
 */
export function useSessionMutations(options: UseSessionMutationsOptions) {
  const { api, dispatch, sessionRef, heartbeat, hydrateDraft, errorMessage, unavailableMessage } = options;
  const mutationKeys = useRef(new Map<string, string>());
  const retryMutation = useRef<(() => Promise<void>) | null>(null);
  const [hasRetryAction, setHasRetryAction] = useState(false);

  const reloadAfterHeartbeatFailure = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) throw new PracticeApiError(unavailableMessage, 0, "SESSION_UNAVAILABLE");
    const latest = await api.getSession(session.publicId);
    sessionRef.current = latest;
    heartbeat.markSynced();
    hydrateDraft(latest);
    dispatch({ type: "received", session: latest });
  }, [api, dispatch, heartbeat, hydrateDraft, sessionRef, unavailableMessage]);

  /** Waits for a running heartbeat and reloads the session if one failed, so the next command sends a current version. */
  const settleHeartbeat = useCallback(async () => {
    const pending = heartbeat.pending();
    if (pending && !(await pending)) await reloadAfterHeartbeatFailure();
    if (heartbeat.needsSync()) await reloadAfterHeartbeatFailure();
  }, [heartbeat, reloadAfterHeartbeatFailure]);

  const runMutation = useCallback(async (scope: string, action: SessionAction,
    onSuccess: (session: PracticeSession) => void = (next) => dispatch({ type: "mutation_succeeded", session: next })) => {
    const idempotencyKey = mutationKeys.current.get(scope) ?? createPracticeIdempotencyKey(scope);
    mutationKeys.current.set(scope, idempotencyKey);
    const retry = async () => {
      heartbeat.setBusy(true);
      dispatch({ type: "mutation_started" });
      try {
        await settleHeartbeat();
        const next = await action(idempotencyKey);
        mutationKeys.current.delete(scope);
        retryMutation.current = null;
        setHasRetryAction(false);
        sessionRef.current = next;
        hydrateDraft(next);
        onSuccess(next);
      } catch (reason) {
        retryMutation.current = retry;
        setHasRetryAction(true);
        dispatch({ type: "failed", message: errorMessage(reason) });
      } finally {
        heartbeat.setBusy(false);
      }
    };
    retryMutation.current = retry;
    await retry();
  }, [dispatch, errorMessage, heartbeat, hydrateDraft, sessionRef, settleHeartbeat]);

  /** Same version and idempotency rules as `runMutation`, but a failure is returned instead of replacing the screen. */
  const runBackgroundMutation = useCallback(async (scope: string, action: SessionAction):
    Promise<BackgroundResult<PracticeSession>> => {
    const idempotencyKey = mutationKeys.current.get(scope) ?? createPracticeIdempotencyKey(scope);
    mutationKeys.current.set(scope, idempotencyKey);
    heartbeat.setBusy(true);
    try {
      const result = await runInBackground({ settleHeartbeat, action: () => action(idempotencyKey) });
      if (result.ok) {
        mutationKeys.current.delete(scope);
        sessionRef.current = result.value;
        dispatch({ type: "mutation_succeeded", session: result.value });
      }
      return result;
    } finally {
      heartbeat.setBusy(false);
    }
  }, [dispatch, heartbeat, sessionRef, settleHeartbeat]);

  /** Re-runs the last failed command; false when there is none (the caller then reloads the session instead). */
  const retryLastMutation = useCallback((): boolean => {
    if (!retryMutation.current) return false;
    void retryMutation.current();
    return true;
  }, []);

  return { runMutation, runBackgroundMutation, retryLastMutation, hasRetryAction };
}
