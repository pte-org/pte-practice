import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOneShotTimer } from "@/features/deviceCheck/one-shot-timer";

describe("one-shot timer", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("fires once after the delay and is then no longer pending", () => {
    const timer = createOneShotTimer();
    const callback = vi.fn();
    timer.start(callback, 5000);
    expect(timer.pending).toBe(true);
    vi.advanceTimersByTime(4999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(timer.pending).toBe(false);
    vi.advanceTimersByTime(60_000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("never fires once cancelled, as when the dialog is closed mid-test", () => {
    const timer = createOneShotTimer();
    const callback = vi.fn();
    timer.start(callback, 5000);
    timer.cancel();
    expect(timer.pending).toBe(false);
    vi.advanceTimersByTime(60_000);
    expect(callback).not.toHaveBeenCalled();
  });

  it("replaces a pending run when started again", () => {
    const timer = createOneShotTimer();
    const first = vi.fn();
    const second = vi.fn();
    timer.start(first, 5000);
    vi.advanceTimersByTime(3000);
    timer.start(second, 5000);
    vi.advanceTimersByTime(60_000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled when nothing is pending", () => {
    const timer = createOneShotTimer();
    expect(() => timer.cancel()).not.toThrow();
    expect(timer.pending).toBe(false);
  });
});
