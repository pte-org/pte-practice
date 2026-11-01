import { describe, expect, it } from "vitest";
import { buildChangePasswordBody } from "@/features/auth/change-password-body";

describe("buildChangePasswordBody", () => {
  it("sends the current session's refresh token so the other devices are signed out", () => {
    expect(
      buildChangePasswordBody("Old", "NewPassword456", { refreshToken: "refresh-1" }),
    ).toEqual({ currentPassword: "Old", newPassword: "NewPassword456", refreshToken: "refresh-1" });
  });

  it("leaves the field out when there is no session to keep", () => {
    expect(buildChangePasswordBody("Old", "NewPassword456", null)).toEqual({
      currentPassword: "Old",
      newPassword: "NewPassword456",
    });
  });
});
