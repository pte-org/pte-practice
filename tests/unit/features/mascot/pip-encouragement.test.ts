import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schedulePipEncouragement } from "@/features/mascot/schedulePipEncouragement";

describe("Pip encouragement timing", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

  it("waits thirty seconds and repeats while the page is visible", () => {
    const encourage = vi.fn();
    const stop = schedulePipEncouragement(encourage, () => true);
    vi.advanceTimersByTime(29_999);
    expect(encourage).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(encourage).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(30_000);
    expect(encourage).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stays quiet in hidden tabs and can resume when visible", () => {
    const encourage = vi.fn();
    let visible = false;
    const stop = schedulePipEncouragement(encourage, () => visible);
    vi.advanceTimersByTime(60_000);
    expect(encourage).not.toHaveBeenCalled();
    visible = true;
    vi.advanceTimersByTime(30_000);
    expect(encourage).toHaveBeenCalledOnce();
    stop();
  });

  it("does not leave a reminder running after unmount", () => {
    const encourage = vi.fn();
    const stop = schedulePipEncouragement(encourage, () => true);
    stop();
    vi.advanceTimersByTime(90_000);
    expect(encourage).not.toHaveBeenCalled();
  });

  it("restarts the thirty-second wait after a manual interaction", () => {
    const encourage = vi.fn();
    const stopFirst = schedulePipEncouragement(encourage, () => true);
    vi.advanceTimersByTime(20_000);
    stopFirst();
    const stop = schedulePipEncouragement(encourage, () => true);
    vi.advanceTimersByTime(29_999);
    expect(encourage).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(encourage).toHaveBeenCalledOnce();
    stop();
  });
});
