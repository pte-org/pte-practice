import type { MockTest } from "./mock-test-contracts";

export type MockTestAction = "START" | "CONTINUE" | "RETAKE";

/** What the row's button does, from the latest attempt: nothing yet starts, unfinished continues, finished retakes. */
export function mockTestAction(test: MockTest): MockTestAction {
  const status = test.latestAttempt?.status;
  if (status === "OVERVIEW" || status === "IN_PROGRESS") return "CONTINUE";
  if (status === "COMPLETED") return "RETAKE";
  return "START";
}

/** "2h 15m", "45m", "2h" - the estimated length shown on a row. */
export function formatEstimatedDuration(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
