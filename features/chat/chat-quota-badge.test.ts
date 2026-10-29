import { describe, expect, it } from "vitest";
import { isQuotaResetDue, quotaBadge } from "./chat-quota";
import type { ChatQuota } from "./contracts";

const RESET_AT = "2026-10-29T03:00:00Z";
const quota = (remaining: number, resetAt = RESET_AT): ChatQuota => ({ used: 20 - remaining, remaining, limit: 20, resetAt });

describe("quotaBadge", () => {
  it("shows nothing until the quota is known", () => {
    expect(quotaBadge(null)).toBeNull();
  });

  it("shows the remaining count", () => {
    expect(quotaBadge(quota(12))).toEqual({ text: "12", low: false });
  });

  it("marks a low count", () => {
    expect(quotaBadge(quota(3))).toEqual({ text: "3", low: true });
    expect(quotaBadge(quota(0))).toEqual({ text: "0", low: true });
  });

  it("never shows a negative count", () => {
    expect(quotaBadge({ ...quota(0), remaining: -2 })).toEqual({ text: "0", low: true });
  });
});

describe("isQuotaResetDue", () => {
  it("is false before the reset time", () => {
    expect(isQuotaResetDue(quota(0), new Date("2026-10-29T02:59:59Z"))).toBe(false);
  });

  it("is true at and after the reset time, even if the server still reports the old one", () => {
    expect(isQuotaResetDue(quota(0), new Date("2026-10-29T03:00:00Z"))).toBe(true);
    expect(isQuotaResetDue(quota(0), new Date("2026-10-29T03:05:00Z"))).toBe(true);
  });

  it("is false for an unknown quota or an unreadable time", () => {
    expect(isQuotaResetDue(null, new Date())).toBe(false);
    expect(isQuotaResetDue(quota(0, "not a date"), new Date())).toBe(false);
  });
});
