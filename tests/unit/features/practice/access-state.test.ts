import { describe, expect, it } from "vitest";
import { accessStateForUi, lockReasonToMessageKey } from "@/features/practice/access-state";

describe("practice access during token and data refresh", () => {
  it("retains a confirmed grant during background revalidation", () => {
    expect(accessStateForUi("authenticated", "refreshing", "UNLOCKED")).toBe("unlocked");
  });
  it("represents initial loading and transient failures without claiming a revoked grant", () => {
    expect(accessStateForUi("authenticated", "loading", null)).toBe("loading");
    expect(accessStateForUi("authenticated", "loading", "UNLOCKED")).toBe("loading");
    expect(accessStateForUi("authenticated", "error", "UNLOCKED")).toBe("error");
    expect(accessStateForUi("authenticated", "error", null)).toBe("error");
    expect(accessStateForUi("authenticated", "ready", "UNKNOWN")).toBe("error");
  });
  it("applies confirmed revocation and unlocks again after a successful retry", () => {
    expect(accessStateForUi("authenticated", "ready", "LOCKED")).toBe("locked");
    expect(accessStateForUi("authenticated", "ready", "UNAVAILABLE")).toBe("locked");
    expect(accessStateForUi("authenticated", "ready", "UNLOCKED")).toBe("unlocked");
    expect(accessStateForUi("signed-out", "ready", "UNLOCKED")).toBe("loading");
  });
});

describe("lock reason to message mapping", () => {
  it("maps each lock reason to its corresponding message key", () => {
    expect(lockReasonToMessageKey("ORG_SUSPENDED")).toBe("ui.accessLockedOrgSuspended");
    expect(lockReasonToMessageKey("NO_SUBSCRIPTION")).toBe("ui.accessLockedNoSubscription");
    expect(lockReasonToMessageKey("QUOTA_EXCEEDED")).toBe("ui.accessLockedQuotaExceeded");
    expect(lockReasonToMessageKey("STUDENT_INACTIVE")).toBe("ui.accessLockedStudentInactive");
    expect(lockReasonToMessageKey("NOT_STUDENT")).toBe("ui.accessLockedNotStudent");
  });
  it("falls back to generic locked message for null or unknown reasons", () => {
    expect(lockReasonToMessageKey(null)).toBe("ui.accessLocked");
    expect(lockReasonToMessageKey(undefined)).toBe("ui.accessLocked");
  });
});
