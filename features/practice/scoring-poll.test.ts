import { describe, expect, it } from "vitest";
import type { PracticeItemResult } from "./contracts";
import {
  POLL_INITIAL_DELAY_MS,
  POLL_MAX_DELAY_MS,
  POLL_TIMEOUT_MS,
  nextPollDelay,
  pollItemResult,
} from "./scoring-poll";

function result(state: PracticeItemResult["state"]): PracticeItemResult {
  return {
    itemPublicId: "item-1",
    taskCode: "READ_ALOUD",
    state,
    score: state === "SCORED" ? 72 : null,
    scoreStatus: null,
    subScores: {},
    feedback: null,
    transcript: null,
    failureCode: state === "FAILED" ? "PROVIDER_ERROR" : null,
    retryable: state === "FAILED",
    scoredAt: null,
  };
}

function clock() {
  let now = 0;
  const waits: number[] = [];
  return {
    waits,
    now: () => now,
    sleep: async (ms: number) => { waits.push(ms); now += ms; },
  };
}

describe("scoring poll delay", () => {
  it("starts at 2 seconds and backs off to a 5 second ceiling", () => {
    expect(POLL_INITIAL_DELAY_MS).toBe(2000);
    expect(POLL_MAX_DELAY_MS).toBe(5000);
    let delay = POLL_INITIAL_DELAY_MS;
    const seen = [delay];
    for (let step = 0; step < 6; step += 1) {
      delay = nextPollDelay(delay);
      seen.push(delay);
    }
    expect(seen.every((value) => value >= POLL_INITIAL_DELAY_MS && value <= POLL_MAX_DELAY_MS)).toBe(true);
    expect(seen[seen.length - 1]).toBe(POLL_MAX_DELAY_MS);
    expect(seen).toEqual([...seen].sort((left, right) => left - right));
  });
});

describe("pollItemResult", () => {
  it("stops as soon as the item is scored", async () => {
    const time = clock();
    const answers = [result("SCORING"), result("SCORING"), result("SCORED")];
    let calls = 0;
    const outcome = await pollItemResult(async () => answers[calls++], { now: time.now, sleep: time.sleep });
    expect(outcome.status).toBe("settled");
    expect(outcome.status === "settled" && outcome.result.state).toBe("SCORED");
    expect(calls).toBe(3);
    expect(time.waits).toHaveLength(2);
  });

  it("stops on a failed item so the learner can retry", async () => {
    const time = clock();
    const outcome = await pollItemResult(async () => result("FAILED"), { now: time.now, sleep: time.sleep });
    expect(outcome.status === "settled" && outcome.result.state).toBe("FAILED");
    expect(time.waits).toHaveLength(0);
  });

  it("gives up after the client timeout instead of polling forever", async () => {
    const time = clock();
    let calls = 0;
    const outcome = await pollItemResult(async () => { calls += 1; return result("SCORING"); },
      { now: time.now, sleep: time.sleep });
    expect(outcome.status).toBe("timeout");
    expect(POLL_TIMEOUT_MS).toBe(120_000);
    expect(time.now()).toBeLessThanOrEqual(POLL_TIMEOUT_MS + POLL_MAX_DELAY_MS);
    expect(calls).toBeGreaterThan(20);
    expect(calls).toBeLessThan(70);
  });

  it("stops without another request once aborted", async () => {
    const time = clock();
    const controller = new AbortController();
    let calls = 0;
    const outcome = await pollItemResult(async () => {
      calls += 1;
      if (calls === 2) controller.abort();
      return result("SCORING");
    }, { now: time.now, sleep: time.sleep, signal: controller.signal });
    expect(outcome.status).toBe("aborted");
    expect(calls).toBe(2);
  });

  it("keeps polling through a transient network error, then reports it if it persists", async () => {
    const time = clock();
    let calls = 0;
    const flaky = await pollItemResult(async () => {
      calls += 1;
      if (calls === 1) throw new Error("network");
      return result("SCORED");
    }, { now: time.now, sleep: time.sleep });
    expect(flaky.status).toBe("settled");

    const broken = await pollItemResult(async () => { throw new Error("down"); },
      { now: clock().now, sleep: clock().sleep });
    expect(broken.status).toBe("error");
  });
});
