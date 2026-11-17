import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createIntervalTimer, createOneShotTimer } from "@/features/deviceCheck/one-shot-timer";

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

describe("interval timer", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("repeats until cancelled, as the playback progress does", () => {
    const timer = createIntervalTimer();
    const callback = vi.fn();
    timer.start(callback, 80);
    expect(timer.running).toBe(true);
    vi.advanceTimersByTime(400);
    expect(callback).toHaveBeenCalledTimes(5);
    timer.cancel();
    expect(timer.running).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(callback).toHaveBeenCalledTimes(5);
  });

  it("stops for good when cancelled from inside its own callback", () => {
    const timer = createIntervalTimer();
    const callback = vi.fn(() => { if (callback.mock.calls.length === 2) timer.cancel(); });
    timer.start(callback, 80);
    vi.advanceTimersByTime(10_000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("replaces a running timer when started again and can be cancelled when idle", () => {
    const timer = createIntervalTimer();
    const first = vi.fn();
    const second = vi.fn();
    timer.start(first, 100);
    vi.advanceTimersByTime(250);
    timer.start(second, 100);
    vi.advanceTimersByTime(250);
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    timer.cancel();
    expect(() => timer.cancel()).not.toThrow();
  });
});

