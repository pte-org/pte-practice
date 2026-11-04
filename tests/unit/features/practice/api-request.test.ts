import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PracticeApiError,
  createPracticeApiClient,
  createPracticeIdempotencyKey,
  getApiBaseUrl,
  practiceRequest,
} from "@/features/practice/api";
import { API_ERROR_TEXT, API_PATHS } from "@/features/practice/constants";
import { getPracticeSession, savePracticeSession } from "@/features/practice/session-storage";

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

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const signIn = (accessToken = "access-1", refreshToken = "refresh-1") =>
  savePracticeSession({ accessToken, refreshToken, tokenType: "Bearer", expiresInSeconds: 3600, mustChangePassword: false });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: new MemoryStorage() });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const headersOf = (call: number): Headers => (fetchMock.mock.calls[call][1] as RequestInit).headers as Headers;

describe("getApiBaseUrl", () => {
  it("removes one trailing slash from the configured address", () => {
    expect(getApiBaseUrl()).toBe("https://api.example.test");
  });

  it("falls back to the local default when nothing is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", undefined as unknown as string);
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });
});

describe("createPracticeIdempotencyKey", () => {
  it("starts with the prefix and differs on every call", () => {
    const first = createPracticeIdempotencyKey("answer");
    const second = createPracticeIdempotencyKey("answer");

    expect(first.startsWith("answer-")).toBe(true);
    expect(first).not.toBe(second);
  });
});

describe("practiceRequest", () => {
  it("sends the bearer token and a JSON body, and unwraps the success envelope", async () => {
    signIn("tok");
    fetchMock.mockResolvedValue(json(200, { success: true, data: { ok: 1 } }));

    const result = await practiceRequest<{ ok: number }>("/x", { method: "POST", body: { a: 1 } });

    expect(result).toEqual({ ok: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/x");
    expect(headersOf(0).get("Authorization")).toBe("Bearer tok");
    expect(headersOf(0).get("Content-Type")).toBe("application/json");
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe('{"a":1}');
  });

  it("sends no auth header and no content type for an anonymous call without a body", async () => {
    fetchMock.mockResolvedValue(json(200, { plain: true }));

    await expect(practiceRequest("/x")).resolves.toEqual({ plain: true });
    expect(headersOf(0).has("Authorization")).toBe(false);
    expect(headersOf(0).has("Content-Type")).toBe(false);
  });

  it("returns an unenveloped body as it is", async () => {
    fetchMock.mockResolvedValue(json(200, [1, 2]));

    await expect(practiceRequest("/x")).resolves.toEqual([1, 2]);
  });

  it("rejects an envelope with success false using the server code", async () => {
    fetchMock.mockResolvedValue(json(200, { success: false, data: null, code: "  QUOTA  " }));

    await expect(practiceRequest("/x")).rejects.toMatchObject({
      status: 400, code: "QUOTA", message: API_ERROR_TEXT.requestRejected,
    });
  });

  it("maps an error response to PracticeApiError with user message, code and data", async () => {
    fetchMock.mockResolvedValue(json(409, { userMessage: "Already started", code: "ALREADY", data: { until: 5 } }));

    const error = await practiceRequest("/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PracticeApiError);
    expect(error).toMatchObject({ message: "Already started", status: 409, code: "ALREADY", data: { until: 5 } });
  });

  it("uses the generic message and a null code when the error body has neither", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 500 }));

    await expect(practiceRequest("/x")).rejects.toMatchObject({
      message: API_ERROR_TEXT.requestFailed, status: 500, code: null,
    });
  });

  it("reports a network failure as NETWORK_ERROR with status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));

    await expect(practiceRequest("/x")).rejects.toMatchObject({
      status: 0, code: "NETWORK_ERROR", message: API_ERROR_TEXT.network,
    });
  });
});

describe("token refresh on 401", () => {
  it("refreshes once, stores the new tokens and retries the original request", async () => {
    signIn("old-access", "refresh-1");
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, { success: true, data: { accessToken: "new-access", refreshToken: "refresh-2", expiresInSeconds: 60 } }))
      .mockResolvedValueOnce(json(200, { done: true }));

    await expect(practiceRequest("/x")).resolves.toEqual({ done: true });

    expect(fetchMock.mock.calls[1][0]).toBe(`https://api.example.test${API_PATHS.refreshToken}`);
    expect(headersOf(2).get("Authorization")).toBe("Bearer new-access");
    expect(getPracticeSession()?.accessToken).toBe("new-access");
  });

  it("clears the session and reports the 401 when the refresh is refused", async () => {
    signIn("old-access", "refresh-1");
    fetchMock.mockResolvedValueOnce(json(401, { code: "EXPIRED" })).mockResolvedValueOnce(json(401, {}));
    fetchMock.mockResolvedValue(json(401, { code: "EXPIRED" }));

    await expect(practiceRequest("/x")).rejects.toMatchObject({ status: 401 });
    expect(getPracticeSession()).toBeNull();
  });

  it("does not try to refresh when the caller disabled it", async () => {
    signIn();
    fetchMock.mockResolvedValue(json(401, { code: "BAD" }));

    await expect(practiceRequest("/x", { allowRefresh: false })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not try to refresh without a stored refresh token", async () => {
    fetchMock.mockResolvedValue(json(401, {}));

    await expect(practiceRequest("/x")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries with the newer token when another request already refreshed in the meantime", async () => {
    signIn("stale", "refresh-1");
    fetchMock.mockImplementationOnce(async () => {
      signIn("fresh", "refresh-2");
      return json(401, {});
    });
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));

    await expect(practiceRequest("/x")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(headersOf(1).get("Authorization")).toBe("Bearer fresh");
  });
});

describe("createPracticeApiClient", () => {
  it("login never refreshes, because a 401 there means a wrong password", async () => {
    signIn();
    fetchMock.mockResolvedValue(json(401, { userMessage: "Wrong password", code: "BAD_CREDENTIALS" }));

    await expect(createPracticeApiClient().login({ username: "u", password: "p" }))
      .rejects.toMatchObject({ status: 401, code: "BAD_CREDENTIALS" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("session mutations carry the idempotency key they are given", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: {} }));

    await createPracticeApiClient().heartbeat("s1", 3, "key-1").catch(() => undefined);

    expect(headersOf(0).get("Idempotency-Key")).toBe("key-1");
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.example.test${API_PATHS.practiceSessions}/s1/heartbeat`);
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe('{"clientVersion":3}');
  });

  it("a session response that cannot be understood becomes a 502 INVALID_SESSION", async () => {
    fetchMock.mockResolvedValue(json(200, { unexpected: true }));

    await expect(createPracticeApiClient().getSession("s1"))
      .rejects.toMatchObject({ status: 502, code: "INVALID_SESSION", message: API_ERROR_TEXT.invalidSession });
  });

  it("a catalog response that cannot be understood becomes a 502 INVALID_CATALOG", async () => {
    fetchMock.mockResolvedValue(json(200, "nonsense"));

    await expect(createPracticeApiClient().getCatalog())
      .rejects.toMatchObject({ status: 502, code: "INVALID_CATALOG" });
  });

  it("completing a recording upload resolves to nothing", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { stored: true } }));

    await expect(createPracticeApiClient().completeResponseAudio("m1", {
      publicId: "p", assetId: "a", secureUrl: "u", resourceType: "video", bytes: 1, durationSeconds: 1, version: 1, signature: "s",
    })).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.example.test${API_PATHS.mediaObjects}/m1/complete`);
  });
});
