"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeApiClient } from "./api";
import type { PracticeItemResult } from "./contracts";
import { pollItemResult } from "./scoring-poll";

type ItemResultWatch = "watching" | "settled" | "timeout" | "error";

export interface ItemResultControls {
  result: PracticeItemResult | null;
  watch: ItemResultWatch;
  retrying: boolean;
  /** Set when the retry request itself failed. */
  retryError: string | null;
  /** Resume polling after a timeout or a run of failed requests. */
  recheck: () => void;
  retryScoring: () => void;
}

/**
 * Follows one answered item until it leaves SCORING. Pass the result the answer call already returned
 * as `initial`; without one the first request is made immediately (review page).
 */
export function useItemResult(
  api: PracticeApiClient,
  sessionId: string,
  itemId: string,
  initial: PracticeItemResult | null,
): ItemResultControls {
  const [result, setResult] = useState<PracticeItemResult | null>(initial);
  const [watch, setWatch] = useState<ItemResultWatch>(initial && initial.state !== "SCORING" ? "settled" : "watching");
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [pollRun, setPollRun] = useState(0);
  const latest = useRef<PracticeItemResult | null>(initial);

  useEffect(() => {
    if (latest.current && latest.current.state !== "SCORING") return;
    const controller = new AbortController();
    void pollItemResult(() => api.getItemResult(sessionId, itemId), {
      signal: controller.signal,
      // A manual recheck should hit the server straight away; only the answer call's own result needs a head start.
      delayFirst: pollRun === 0 && latest.current !== null,
    }).then((outcome) => {
      if (outcome.status === "aborted") return;
      if (outcome.status === "settled") {
        latest.current = outcome.result;
        setResult(outcome.result);
        setWatch("settled");
        return;
      }
      setWatch(outcome.status);
    });
    return () => controller.abort();
  }, [api, sessionId, itemId, pollRun]);

  const recheck = useCallback(() => {
    setWatch("watching");
    setPollRun((run) => run + 1);
  }, []);

  const retryScoring = useCallback(() => {
    setRetrying(true);
    setRetryError(null);
    api.retryScoring(sessionId, itemId)
      .then((next) => {
        latest.current = next;
        setResult(next);
        if (next.state === "SCORING") recheck();
        else setWatch("settled");
      })
      .catch((reason: unknown) => setRetryError(reason instanceof Error ? reason.message : "retry failed"))
      .finally(() => setRetrying(false));
  }, [api, sessionId, itemId, recheck]);

  return { result, watch, retrying, retryError, recheck, retryScoring };
}
