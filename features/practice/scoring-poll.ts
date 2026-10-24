import type { PracticeItemResult } from "./contracts";

export const POLL_INITIAL_DELAY_MS = 2000;
export const POLL_MAX_DELAY_MS = 5000;
/** The server turns a stuck item FAILED after 180 s; the client stops watching earlier and offers a retry. */
export const POLL_TIMEOUT_MS = 120_000;
const MAX_CONSECUTIVE_ERRORS = 3;

export type PollOutcome =
  | { status: "settled"; result: PracticeItemResult }
  | { status: "timeout" }
  | { status: "aborted" }
  | { status: "error"; error: unknown };

export interface PollOptions {
  signal?: AbortSignal;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Wait one interval before the first request (the answer response already carried the first state). */
  delayFirst?: boolean;
}

export function nextPollDelay(current: number): number {
  return Math.min(POLL_MAX_DELAY_MS, Math.round(current * 1.5));
}

/** Polls until the item leaves SCORING, the client timeout passes, the signal aborts, or requests keep failing. */
export async function pollItemResult(
  fetchResult: () => Promise<PracticeItemResult>,
  { signal, now = Date.now, sleep = abortableSleep, delayFirst = false }: PollOptions = {},
): Promise<PollOutcome> {
  const startedAt = now();
  let delay = POLL_INITIAL_DELAY_MS;
  let errors = 0;
  let wait = delayFirst;

  for (;;) {
    if (wait) {
      if (now() - startedAt >= POLL_TIMEOUT_MS) return { status: "timeout" };
      await sleep(delay, signal);
      delay = nextPollDelay(delay);
    }
    wait = true;
    if (signal?.aborted) return { status: "aborted" };
    try {
      const result = await fetchResult();
      if (signal?.aborted) return { status: "aborted" };
      if (result.state !== "SCORING") return { status: "settled", result };
      errors = 0;
    } catch (error) {
      if (signal?.aborted) return { status: "aborted" };
      errors += 1;
      if (errors >= MAX_CONSECUTIVE_ERRORS) return { status: "error", error };
    }
  }
}

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const done = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = window.setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}
