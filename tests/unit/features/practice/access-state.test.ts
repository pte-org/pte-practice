import { describe, expect, it } from "vitest";
import { accessStateForUi } from "@/features/practice/access-state";

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
