import { describe, expect, it, vi } from "vitest";
import { refreshOnce } from "@/features/practice/token-refresh";

describe("refreshOnce", () => {
  it("shares one refresh between requests that fail together", async () => {
    let release: (value: boolean) => void = () => {};
    const doRefresh = vi.fn(() => new Promise<boolean>((resolve) => { release = resolve; }));

    const results = [refreshOnce("r1", doRefresh), refreshOnce("r1", doRefresh), refreshOnce("r1", doRefresh)];
    release(true);

    expect(await Promise.all(results)).toEqual([true, true, true]);
    expect(doRefresh).toHaveBeenCalledTimes(1);
  });

  it("starts a new refresh once the previous one has finished", async () => {
    const doRefresh = vi.fn(async () => false);
    await refreshOnce("r1", doRefresh);
    await refreshOnce("r2", doRefresh);
    expect(doRefresh).toHaveBeenCalledTimes(2);
  });
});
