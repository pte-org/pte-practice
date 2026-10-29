import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeApiError, practiceRequest } from "./api";

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function captureError(path: string): Promise<PracticeApiError> {
  try {
    await practiceRequest(path);
  } catch (error) {
    return error as PracticeApiError;
  }
  throw new Error("expected practiceRequest to reject");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PracticeApiError data", () => {
  it("is undefined when the constructor is called with the original three arguments", () => {
    const error = new PracticeApiError("boom", 500, "SOME_CODE");
    expect(error.data).toBeUndefined();
    expect(error.message).toBe("boom");
    expect(error.status).toBe(500);
    expect(error.code).toBe("SOME_CODE");
    expect(error.name).toBe("PracticeApiError");
  });

  it("is undefined when constructed with only a message", () => {
    const error = new PracticeApiError("boom");
    expect(error.data).toBeUndefined();
    expect(error.status).toBe(0);
    expect(error.code).toBeNull();
  });

  it("exposes an optional fourth constructor argument as data", () => {
    const data = { resetAt: "2026-10-29T00:00:00Z" };
    const error = new PracticeApiError("limit", 429, "CHAT_QUOTA_EXCEEDED", data);
    expect(error.data).toEqual(data);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("practiceRequest error data", () => {
  it("passes the data field of a 429 error body into the thrown error", async () => {
    const data = { resetAt: "2026-10-29T03:00:00Z", limit: 20, remaining: 0 };
    stubFetch(429, { code: "CHAT_QUOTA_EXCEEDED", userMessage: "x", data });

    const error = await captureError("/api/v1/student/chat/messages");

    expect(error).toBeInstanceOf(PracticeApiError);
    expect(error.status).toBe(429);
    expect(error.code).toBe("CHAT_QUOTA_EXCEEDED");
    expect(error.message).toBe("x");
    expect(error.data).toEqual(data);
  });

  it("leaves data undefined for a non-2xx response without a data field", async () => {
    stubFetch(409, { code: "CHAT_REQUEST_IN_FLIGHT", userMessage: "busy" });

    const error = await captureError("/api/v1/student/chat/messages");

    expect(error.status).toBe(409);
    expect(error.code).toBe("CHAT_REQUEST_IN_FLIGHT");
    expect(error.message).toBe("busy");
    expect(error.data).toBeUndefined();
  });

  it("keeps status and code null-safe for an error body that is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 503 })));

    const error = await captureError("/api/v1/student/chat/messages");

    expect(error.status).toBe(503);
    expect(error.code).toBeNull();
    expect(error.data).toBeUndefined();
  });

  it("still returns the unwrapped data on success", async () => {
    stubFetch(200, { success: true, data: { used: 1, remaining: 19, limit: 20, resetAt: "2026-10-29T00:00:00Z" } });

    const result = await practiceRequest<{ used: number }>("/api/v1/student/chat/quota");

    expect(result.used).toBe(1);
  });
});
