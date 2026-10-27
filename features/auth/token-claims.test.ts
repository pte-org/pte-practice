import { describe, expect, it } from "vitest";
import { hasStudentRole } from "./token-claims";

function token(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `header.${payload}.signature`;
}

describe("hasStudentRole", () => {
  it("accepts a token whose roles include STUDENT", () => {
    expect(hasStudentRole(token({ roles: ["STUDENT"], tenant_id: "t-1" }))).toBe(true);
  });

  it("rejects a staff token", () => {
    expect(hasStudentRole(token({ roles: ["HOST_ADMIN"] }))).toBe(false);
  });

  it("rejects a token without a roles array or with a broken payload", () => {
    expect(hasStudentRole(token({ roles: "STUDENT" }))).toBe(false);
    expect(hasStudentRole("not-a-jwt")).toBe(false);
    expect(hasStudentRole("header.%%%.signature")).toBe(false);
  });
});
