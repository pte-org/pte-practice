import type { EntitlementState } from "./contracts";

export type PracticeAuthStatus = "loading" | "authenticated" | "signed-out";
export type PracticeDataStatus = "idle" | "loading" | "refreshing" | "ready" | "error";
export type PracticeAccessState = "loading" | "unlocked" | "locked" | "error";

export const accessStateForUi = (auth: PracticeAuthStatus, status: PracticeDataStatus,
  entitlement: EntitlementState | null): PracticeAccessState => {
  if (auth !== "authenticated") return "loading";
  if (status === "error") return "error";
  // Background revalidation keeps the last confirmed grant until a response arrives.
  if (entitlement === "UNLOCKED" && (status === "ready" || status === "refreshing")) return "unlocked";
  if (status === "loading" || status === "idle") return "loading";
  if (entitlement === "LOCKED" || entitlement === "UNAVAILABLE" || entitlement === "AMBIGUOUS") return "locked";
  return "error";
};
