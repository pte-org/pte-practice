import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRACTICE_STORAGE_KEYS } from "@/features/practice/constants";
import {
  clearPracticeDraft,
  clearPracticeDrafts,
  clearPracticeSession,
  getPracticeDraft,
  getPracticeSession,
  savePracticeDraft,
  savePracticeSession,
} from "@/features/practice/session-storage";

class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const NOW = new Date("2026-11-03T08:00:00Z").getTime();
let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const tokens = { accessToken: "a", refreshToken: "r", tokenType: "Bearer", expiresInSeconds: 60, mustChangePassword: false };

describe("session tokens", () => {
  it("returns null when nothing is stored", () => {
    expect(getPracticeSession()).toBeNull();
  });

  it("stores tokens with an absolute expiry computed from expiresInSeconds", () => {
    savePracticeSession(tokens);

    expect(getPracticeSession()).toMatchObject({ accessToken: "a", refreshToken: "r", expiresAt: NOW + 60_000 });
  });

  it("keeps an expiry that the caller already set", () => {
    savePracticeSession({ ...tokens, expiresAt: 123 });

    expect(getPracticeSession()?.expiresAt).toBe(123);
  });

  it("fills defaults for missing optional fields when reading", () => {
    storage.setItem(PRACTICE_STORAGE_KEYS.session, JSON.stringify({ accessToken: "a", refreshToken: "r" }));

    expect(getPracticeSession()).toEqual({
      accessToken: "a", refreshToken: "r", tokenType: "Bearer", expiresInSeconds: 0, mustChangePassword: false, expiresAt: undefined,
    });
  });

  it("returns null when a token is missing or not a string", () => {
    storage.setItem(PRACTICE_STORAGE_KEYS.session, JSON.stringify({ accessToken: "a" }));
    expect(getPracticeSession()).toBeNull();

    storage.setItem(PRACTICE_STORAGE_KEYS.session, JSON.stringify({ accessToken: 1, refreshToken: "r" }));
    expect(getPracticeSession()).toBeNull();
  });

  it("returns null for corrupt JSON instead of throwing", () => {
    storage.setItem(PRACTICE_STORAGE_KEYS.session, "{oops");

    expect(getPracticeSession()).toBeNull();
  });

  it("clearPracticeSession removes the tokens only", () => {
    savePracticeSession(tokens);
    savePracticeDraft("s", "i", { text: "x" });

    clearPracticeSession();

    expect(getPracticeSession()).toBeNull();
    expect(getPracticeDraft("s", "i")).not.toBeNull();
  });
});

describe("drafts", () => {
  it("returns what was saved, with the save time", () => {
    savePracticeDraft("s1", "i1", { text: "hello" });

    expect(getPracticeDraft("s1", "i1")).toEqual({ payload: { text: "hello" }, savedAt: NOW });
  });

  it("keeps drafts of different items apart", () => {
    savePracticeDraft("s1", "i1", { text: "one" });
    savePracticeDraft("s1", "i2", { text: "two" });

    expect(getPracticeDraft("s1", "i2")?.payload).toEqual({ text: "two" });
    expect(getPracticeDraft("s2", "i1")).toBeNull();
  });

  it("clearPracticeDraft removes one draft only", () => {
    savePracticeDraft("s1", "i1", { a: 1 });
    savePracticeDraft("s1", "i2", { a: 2 });

    clearPracticeDraft("s1", "i1");

    expect(getPracticeDraft("s1", "i1")).toBeNull();
    expect(getPracticeDraft("s1", "i2")).not.toBeNull();
  });

  it("rejects a stored draft whose payload is missing, not an object or an array", () => {
    const key = `${PRACTICE_STORAGE_KEYS.draftPrefix}s1.i1`;
    for (const stored of [{ savedAt: 1 }, { payload: "text", savedAt: 1 }, { payload: [1, 2], savedAt: 1 }]) {
      storage.setItem(key, JSON.stringify(stored));
      expect(getPracticeDraft("s1", "i1")).toBeNull();
    }
  });

  it("uses savedAt 0 when the stored time is not a number", () => {
    storage.setItem(`${PRACTICE_STORAGE_KEYS.draftPrefix}s1.i1`, JSON.stringify({ payload: { a: 1 }, savedAt: "yesterday" }));

    expect(getPracticeDraft("s1", "i1")?.savedAt).toBe(0);
  });

  it("returns null for a corrupt draft", () => {
    storage.setItem(`${PRACTICE_STORAGE_KEYS.draftPrefix}s1.i1`, "not json");

    expect(getPracticeDraft("s1", "i1")).toBeNull();
  });

  it("saving a draft does not throw when storage is full", () => {
    vi.stubGlobal("window", {
      localStorage: { ...storage, setItem: () => { throw new Error("QuotaExceededError"); }, getItem: () => null },
    });

    expect(() => savePracticeDraft("s1", "i1", { a: 1 })).not.toThrow();
  });

  it("clearPracticeDrafts removes every draft and leaves other keys, such as the tokens", () => {
    savePracticeSession(tokens);
    savePracticeDraft("s1", "i1", { a: 1 });
    savePracticeDraft("s2", "i9", { a: 2 });
    storage.setItem("unrelated", "keep");

    clearPracticeDrafts();

    expect(getPracticeDraft("s1", "i1")).toBeNull();
    expect(getPracticeDraft("s2", "i9")).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(getPracticeSession()).not.toBeNull();
  });
});

describe("without a browser", () => {
  it("every function is a safe no-op when window is not defined", () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("window", undefined);

    expect(getPracticeSession()).toBeNull();
    expect(getPracticeDraft("s", "i")).toBeNull();
    expect(() => {
      savePracticeSession(tokens);
      clearPracticeSession();
      clearPracticeDrafts();
      savePracticeDraft("s", "i", {});
      clearPracticeDraft("s", "i");
    }).not.toThrow();
  });
});
