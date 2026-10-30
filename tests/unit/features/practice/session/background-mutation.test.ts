import { describe, expect, it, vi } from "vitest";
import { runInBackground } from "@/features/practice/session/background-mutation";

describe("runInBackground", () => {
  it("settles the heartbeat before running the action and returns its value", async () => {
    const order: string[] = [];
    const result = await runInBackground({
      settleHeartbeat: async () => { order.push("heartbeat"); },
      action: async () => { order.push("action"); return 42; },
    });

    expect(order).toEqual(["heartbeat", "action"]);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("reports a failed action instead of throwing, so the caller keeps its in-memory recording", async () => {
    const failure = new Error("upload failed");
    const result = await runInBackground({ settleHeartbeat: async () => {}, action: async () => { throw failure; } });

    expect(result).toEqual({ ok: false, reason: failure });
  });

  it("does not run the action when the heartbeat cannot settle", async () => {
    const action = vi.fn(async () => 1);
    const result = await runInBackground({ settleHeartbeat: async () => { throw new Error("stale"); }, action });

    expect(result.ok).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });
});
