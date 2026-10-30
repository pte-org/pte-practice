import { describe, expect, it } from "vitest";
import { PracticeApiError } from "@/features/practice/api";
import type { ChatQuota } from "@/features/chat/contracts";
import { isQuotaExhausted, quotaFromError, quotaNoticeKind, timeUntilReset } from "@/features/chat/chat-quota";

const RESET_AT = "2026-10-29T03:00:00Z";

function quota(remaining: number, limit = 20): ChatQuota {
  return { used: limit - remaining, remaining, limit, resetAt: RESET_AT };
}

describe("isQuotaExhausted", () => {
  it("is true when nothing remains", () => {
    expect(isQuotaExhausted(quota(0))).toBe(true);
  });

  it("is true when remaining is below zero", () => {
    expect(isQuotaExhausted({ ...quota(0), remaining: -1 })).toBe(true);
  });

  it("is false while questions remain", () => {
    expect(isQuotaExhausted(quota(1))).toBe(false);
    expect(isQuotaExhausted(quota(20))).toBe(false);
  });

  it("is false while the quota is still unknown", () => {
    expect(isQuotaExhausted(null)).toBe(false);
  });
});

describe("quotaNoticeKind", () => {
  it("is exhausted at zero", () => {
    expect(quotaNoticeKind(quota(0))).toBe("exhausted");
  });

  it.each([1, 2, 3])("warns with %i remaining", (remaining) => {
    expect(quotaNoticeKind(quota(remaining))).toBe("warning");
  });

  it.each([4, 10, 20])("is quiet with %i remaining", (remaining) => {
    expect(quotaNoticeKind(quota(remaining))).toBe("none");
  });

  it("is quiet while the quota is unknown", () => {
    expect(quotaNoticeKind(null)).toBe("none");
  });
});

describe("timeUntilReset", () => {
  const now = new Date("2026-10-28T12:00:00Z");

  it("splits hours and minutes", () => {
    expect(timeUntilReset("2026-10-28T15:25:00Z", now)).toEqual({ hours: 3, minutes: 25 });
  });

  it("handles a reset under an hour away", () => {
    expect(timeUntilReset("2026-10-28T12:45:00Z", now)).toEqual({ hours: 0, minutes: 45 });
  });

  it("rounds a partial minute up", () => {
    expect(timeUntilReset("2026-10-28T12:00:01Z", now)).toEqual({ hours: 0, minutes: 1 });
  });

  it("rounds 1h59m01s up to 2h0m", () => {
    expect(timeUntilReset("2026-10-28T13:59:01Z", now)).toEqual({ hours: 2, minutes: 0 });
  });

  it("handles exact hours", () => {
    expect(timeUntilReset("2026-10-28T14:00:00Z", now)).toEqual({ hours: 2, minutes: 0 });
  });

  it("handles more than a day", () => {
    expect(timeUntilReset("2026-10-29T14:30:00Z", now)).toEqual({ hours: 26, minutes: 30 });
  });

  it("never goes negative once the reset has passed", () => {
    expect(timeUntilReset("2026-10-28T11:00:00Z", now)).toEqual({ hours: 0, minutes: 0 });
  });

  it("is zero at the reset instant", () => {
    expect(timeUntilReset("2026-10-28T12:00:00Z", now)).toEqual({ hours: 0, minutes: 0 });
  });

  it.each(["", "not-a-date", "2026-13-45"])("returns zeros for an invalid date %j", (resetAt) => {
    expect(timeUntilReset(resetAt, now)).toEqual({ hours: 0, minutes: 0 });
  });
});

describe("quotaFromError", () => {
  const data = { resetAt: RESET_AT, limit: 20, remaining: 0 };

  it("derives an exhausted quota from a quota-exceeded error", () => {
    const error = new PracticeApiError("limit", 429, "CHAT_QUOTA_EXCEEDED", data);
    expect(quotaFromError(error)).toEqual({ used: 20, remaining: 0, limit: 20, resetAt: RESET_AT });
  });

  it("returns null for another error code", () => {
    expect(quotaFromError(new PracticeApiError("busy", 503, "CHAT_BUSY", data))).toBeNull();
  });

  it("returns null when the quota error carries no data", () => {
    expect(quotaFromError(new PracticeApiError("limit", 429, "CHAT_QUOTA_EXCEEDED"))).toBeNull();
  });

  it.each([
    ["missing resetAt", { limit: 20, remaining: 0 }],
    ["invalid resetAt", { resetAt: "garbage", limit: 20, remaining: 0 }],
    ["missing limit", { resetAt: RESET_AT, remaining: 0 }],
    ["string limit", { resetAt: RESET_AT, limit: "20", remaining: 0 }],
    ["negative limit", { resetAt: RESET_AT, limit: -1, remaining: 0 }],
    ["non-object data", "oops"],
  ])("returns null for malformed data (%s)", (_label, badData) => {
    expect(quotaFromError(new PracticeApiError("limit", 429, "CHAT_QUOTA_EXCEEDED", badData))).toBeNull();
  });

  it.each([null, undefined, "error", 429, new Error("plain"), { code: "CHAT_QUOTA_EXCEEDED", data }])(
    "returns null for a non-PracticeApiError value %j",
    (value) => {
      expect(quotaFromError(value)).toBeNull();
    },
  );
});
