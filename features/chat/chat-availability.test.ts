import { describe, expect, it } from "vitest";
import { PracticeApiError } from "@/features/practice/api";
import { isChatUnavailable } from "./chat-availability";

describe("isChatUnavailable", () => {
  it.each([
    new PracticeApiError("not entitled", 403, "PRACTICE_NOT_ENTITLED"),
    new PracticeApiError("forbidden", 403, "FORBIDDEN"),
    new PracticeApiError("forbidden", 403),
    new PracticeApiError("not found", 404),
    new PracticeApiError("not found", 404, "NOT_FOUND"),
  ])("is true when the server says this student cannot use chat at all (%#)", (error) => {
    expect(isChatUnavailable(error)).toBe(true);
  });

  it("is false when only the privacy notice is missing, which the panel asks for itself", () => {
    expect(isChatUnavailable(new PracticeApiError("consent", 403, "CHAT_CONSENT_REQUIRED"))).toBe(false);
  });

  it.each([
    new PracticeApiError("offline", 0, "NETWORK_ERROR"),
    new PracticeApiError("server", 500),
    new PracticeApiError("busy", 503, "CHAT_BUSY"),
    new PracticeApiError("slow down", 429),
    new PracticeApiError("expired", 401),
    new Error("plain"),
    "string",
    null,
    undefined,
  ])("is false for a failure that may pass, so the button stays (%#)", (error) => {
    expect(isChatUnavailable(error)).toBe(false);
  });
});
