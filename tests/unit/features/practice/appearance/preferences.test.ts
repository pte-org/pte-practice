import { afterEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_CHANGE_EVENT, APPEARANCE_STORAGE_KEY, MAX_BACKGROUND_DATA_LENGTH } from "@/features/practice/appearance/constants";
import { DEFAULT_APPEARANCE, parseAppearance, readAppearanceSnapshot, resetAppearance, saveAppearance, subscribeAppearance } from "@/features/practice/appearance/preferences";

afterEach(() => vi.unstubAllGlobals());

describe("practice appearance preferences", () => {
  it("falls back safely for corrupt and oversized storage", () => {
    for (const raw of [null, "bad JSON", "null", "[]", "x".repeat(MAX_BACKGROUND_DATA_LENGTH + 2048)]) {
      expect(parseAppearance(raw)).toEqual(DEFAULT_APPEARANCE);
    }
  });

  it("restores known choices and clamps untrusted CSS values to supported options", () => {
    expect(parseAppearance(JSON.stringify({ background: "forest", blur: 12, opacity: 80, focus: true })))
      .toEqual({ ...DEFAULT_APPEARANCE, background: "forest", blur: 12, opacity: 80, focus: true });
    expect(parseAppearance(JSON.stringify({ background: "url(evil)", blur: -10, opacity: 0, focus: "true" })))
      .toEqual(DEFAULT_APPEARANCE);
  });

  it("accepts only bounded local JPEG data and never arbitrary external URLs or SVG", () => {
    for (const image of ["https://example.com/image.jpg", "javascript:alert(1)", "data:image/svg+xml;base64,AAAA"]) {
      expect(parseAppearance(JSON.stringify({ background: "custom", image })).background).toBe(DEFAULT_APPEARANCE.background);
    }
    const image = "data:image/jpeg;base64,YWJj";
    expect(parseAppearance(JSON.stringify({ background: "custom", image })).image).toBe(image);
  });

  it("saves, notifies and resets without touching other storage keys", () => {
    const values = new Map<string, string>([["unrelated", "keep"]]);
    const target = new EventTarget();
    vi.stubGlobal("window", Object.assign(target, { localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } }));
    const notify = vi.fn();
    const stop = subscribeAppearance(notify);
    expect(saveAppearance({ ...DEFAULT_APPEARANCE, background: "ocean" })).toBe(true);
    expect(parseAppearance(readAppearanceSnapshot()).background).toBe("ocean");
    expect(values.has(APPEARANCE_STORAGE_KEY)).toBe(true);
    expect(notify).toHaveBeenCalledOnce();
    expect(resetAppearance()).toBe(true);
    expect(readAppearanceSnapshot()).toBeNull();
    expect(parseAppearance(readAppearanceSnapshot())).toEqual(DEFAULT_APPEARANCE);
    expect(values.get("unrelated")).toBe("keep");
    stop();
    target.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("handles unavailable storage without crashing or falsely reporting a saved choice", () => {
    vi.stubGlobal("window", { get localStorage() { throw new Error("denied"); } });
    expect(readAppearanceSnapshot()).toBeNull();
    expect(saveAppearance(DEFAULT_APPEARANCE)).toBe(false);
    expect(resetAppearance()).toBe(false);
  });
});
