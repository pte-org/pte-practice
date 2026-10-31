import { describe, expect, it } from "vitest";
import { PracticeApiError } from "@/features/practice/api";
import { chatErrorKey } from "@/features/chat/chat-errors";

describe("chatErrorKey", () => {
  it.each([
    ["CHAT_QUOTA_EXCEEDED", 429, "quotaExceeded"],
    ["CHAT_REQUEST_IN_FLIGHT", 409, "inFlight"],
    ["CHAT_BUSY", 503, "busy"],
    ["CHAT_INVALID_REQUEST", 400, "invalidRequest"],
  ])("maps %s to %s", (code, status, key) => {
    expect(chatErrorKey(new PracticeApiError("m", status, code))).toBe(key);
  });

  it("prefers the chat code over the HTTP status", () => {
    expect(chatErrorKey(new PracticeApiError("m", 429, "CHAT_QUOTA_EXCEEDED"))).toBe("quotaExceeded");
    expect(chatErrorKey(new PracticeApiError("m", 500, "CHAT_BUSY"))).toBe("busy");
  });

  it("maps a network failure to network", () => {
    expect(chatErrorKey(new PracticeApiError("offline", 0, "NETWORK_ERROR"))).toBe("network");
  });

  it("maps status 0 without a code to network", () => {
    expect(chatErrorKey(new PracticeApiError("offline", 0))).toBe("network");
  });

  it("maps a global rate limit (429 without a chat code) to busy", () => {
    expect(chatErrorKey(new PracticeApiError("slow down", 429))).toBe("busy");
    expect(chatErrorKey(new PracticeApiError("slow down", 429, "RATE_LIMITED"))).toBe("busy");
  });

  it.each([
    new PracticeApiError("server", 500),
    new PracticeApiError("forbidden", 403, "FORBIDDEN"),
    new PracticeApiError("bad gateway", 502, "CHAT_INVALID_RESPONSE"),
    new PracticeApiError("gone", 404, "CHAT_SESSION_NOT_FOUND"),
    new PracticeApiError("consent", 403, "CHAT_CONSENT_REQUIRED"),
    new Error("plain"),
    "string",
    null,
    undefined,
    {},
  ])("maps anything else, including codes the server no longer sends, to generic (%#)", (error) => {
    expect(chatErrorKey(error)).toBe("generic");
  });
});
