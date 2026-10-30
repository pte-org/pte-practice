import { ROLES_CLAIM, STUDENT_ROLE } from "./constants";

/**
 * Reads the role claim so the sign-in page can turn away a staff account early.
 * This is a UX check only: the token is not verified here, and pte-api still
 * enforces the STUDENT role on every practice endpoint.
 */
export function hasStudentRole(accessToken: string): boolean {
  const roles = readClaims(accessToken)[ROLES_CLAIM];
  return Array.isArray(roles) && roles.includes(STUDENT_ROLE);
}

function readClaims(accessToken: string): Record<string, unknown> {
  const payload = accessToken.split(".")[1];
  if (!payload) return {};
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const value: unknown = JSON.parse(atob(padded));
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
