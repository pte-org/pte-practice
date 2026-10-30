import { describe, expect, it } from "vitest";
import { validateSignInField } from "@/common/hooks/useSignInValidation";

const messages = { usernameRequired: "required", usernameInvalidEmail: "email", passwordRequired: "password" };

describe("validateSignInField", () => {
  it("requires a trimmed username and a password", () => {
    expect(validateSignInField("username", "   ", messages, false)).toBe("required");
    expect(validateSignInField("password", "", messages, false)).toBe("password");
    expect(validateSignInField("password", "x", messages, false)).toBeUndefined();
  });

  it("accepts roster usernames when emails are not required", () => {
    expect(validateSignInField("username", "pte-center.practice01", messages, false)).toBeUndefined();
    expect(validateSignInField("username", "pte-center.practice01", messages)).toBe("email");
  });
});
