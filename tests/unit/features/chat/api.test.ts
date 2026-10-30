import { describe, expect, it, vi } from "vitest";
import { PracticeApiError, type practiceRequest } from "@/features/practice/api";
import { createChatApi } from "@/features/chat/api";

type Request = typeof practiceRequest;

const RESET_AT = "2026-10-29T03:00:00Z";
const reply = {
  markdown: "Use *present perfect*.",
  onTopic: true,
  fromCache: false,
  remaining: 19,
  limit: 20,
  resetAt: RESET_AT,
  sessionId: "0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7b",
};
const quota = { used: 1, remaining: 19, limit: 20, resetAt: RESET_AT };

function fakeRequest(result: unknown) {
  return vi.fn().mockResolvedValue(result) as unknown as ReturnType<typeof vi.fn> & Request;
}

describe("createChatApi.sendMessage", () => {
  const input = { sessionId: reply.sessionId, message: "Explain gerunds", taskType: "WRITE_ESSAY", language: "en" as const };

  it("posts the message body to the messages endpoint", async () => {
    const request = fakeRequest(reply);
    const result = await createChatApi(request).sendMessage(input);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("/api/v1/student/chat/messages", { method: "POST", body: input });
    expect(result).toEqual(reply);
  });

  it("sends a null task type through unchanged", async () => {
    const request = fakeRequest(reply);
    await createChatApi(request).sendMessage({ ...input, taskType: null, language: "vi" });

    expect(request).toHaveBeenCalledWith("/api/v1/student/chat/messages", {
      method: "POST",
      body: { ...input, taskType: null, language: "vi" },
    });
  });

  it("throws CHAT_INVALID_RESPONSE with status 502 when the reply is malformed", async () => {
    const request = fakeRequest({ markdown: 5 });
    const error = await createChatApi(request).sendMessage(input).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PracticeApiError);
    expect((error as PracticeApiError).status).toBe(502);
    expect((error as PracticeApiError).code).toBe("CHAT_INVALID_RESPONSE");
  });

  it("propagates request errors unchanged", async () => {
    const failure = new PracticeApiError("limit", 429, "CHAT_QUOTA_EXCEEDED", { resetAt: RESET_AT, limit: 20, remaining: 0 });
    const request = vi.fn().mockRejectedValue(failure) as unknown as Request;

    await expect(createChatApi(request).sendMessage(input)).rejects.toBe(failure);
  });
});

describe("createChatApi.getQuota", () => {
  it("reads the quota endpoint", async () => {
    const request = fakeRequest(quota);
    const result = await createChatApi(request).getQuota();

    expect(request).toHaveBeenCalledTimes(1);
    const [path, options] = (request as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe("/api/v1/student/chat/quota");
    expect(options?.method ?? "GET").toBe("GET");
    expect(options?.body).toBeUndefined();
    expect(result).toEqual(quota);
  });

  it("throws CHAT_INVALID_RESPONSE with status 502 when the quota is malformed", async () => {
    const error = await createChatApi(fakeRequest({ used: "many" })).getQuota().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PracticeApiError);
    expect((error as PracticeApiError).status).toBe(502);
    expect((error as PracticeApiError).code).toBe("CHAT_INVALID_RESPONSE");
  });

  it("propagates request errors unchanged", async () => {
    const failure = new PracticeApiError("offline", 0, "NETWORK_ERROR");
    const request = vi.fn().mockRejectedValue(failure) as unknown as Request;

    await expect(createChatApi(request).getQuota()).rejects.toBe(failure);
  });
});

describe("createChatApi.getLatestSession", () => {
  it("reads the latest session endpoint", async () => {
    const value = {
      sessionId: reply.sessionId,
      messages: [{ question: "Q", answer: "A", status: "OK", createdAt: "2026-10-28T10:00:00Z" }],
    };
    const request = fakeRequest(value);
    const result = await createChatApi(request).getLatestSession();

    const [path, options] = (request as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe("/api/v1/student/chat/sessions/latest");
    expect(options?.method ?? "GET").toBe("GET");
    expect(result).toEqual(value);
  });

  it("returns an empty session for a new student", async () => {
    const result = await createChatApi(fakeRequest({ sessionId: null, messages: [] })).getLatestSession();
    expect(result).toEqual({ sessionId: null, messages: [] });
  });

  it("throws CHAT_INVALID_RESPONSE with status 502 when the session is malformed", async () => {
    const error = await createChatApi(fakeRequest("nope")).getLatestSession().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PracticeApiError);
    expect((error as PracticeApiError).status).toBe(502);
    expect((error as PracticeApiError).code).toBe("CHAT_INVALID_RESPONSE");
  });

  it("propagates request errors unchanged", async () => {
    const failure = new PracticeApiError("nope", 404, "CHAT_SESSION_NOT_FOUND");
    const request = vi.fn().mockRejectedValue(failure) as unknown as Request;

    await expect(createChatApi(request).getLatestSession()).rejects.toBe(failure);
  });
});
