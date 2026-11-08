import { describe, expect, it } from "vitest";
import { signInErrorKey } from "@/features/auth/login-error";
import { PracticeApiError } from "@/features/practice/api";

describe("signInErrorKey", () => {
  it.each([
    [0, "auth.networkError"],
    [400, "auth.invalidCredentials"],
    [401, "auth.invalidCredentials"],
    [403, "auth.genericError"],
    [429, "auth.rateLimited"],
    [500, "auth.serviceUnavailable"],
    [503, "auth.serviceUnavailable"],
  ])("maps status %i to localized key %s", (status, expected) => {
    expect(signInErrorKey(new PracticeApiError("private diagnostic", Number(status)))).toBe(expected);
  });

  it("never displays raw unexpected errors", () => {
    expect(signInErrorKey(new Error("provider diagnostic"))).toBe("auth.genericError");
  });
});
