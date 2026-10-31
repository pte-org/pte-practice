import { describe, expect, it } from "vitest";
import { normalizeChatQuota, normalizeChatReply } from "@/features/chat/contracts";

const RESET_AT = "2026-10-29T03:00:00Z";

const validQuota = { used: 5, remaining: 15, limit: 20, resetAt: RESET_AT };
const validReply = { markdown: "**Hello**", onTopic: true, remaining: 14, limit: 20, resetAt: RESET_AT };

describe("normalizeChatQuota", () => {
  it("accepts a valid quota", () => {
    expect(normalizeChatQuota(validQuota)).toEqual(validQuota);
  });

  it("drops fields that are not part of the contract", () => {
    expect(normalizeChatQuota({ ...validQuota, extra: "x" })).toEqual(validQuota);
  });

  it("accepts a fully consumed quota", () => {
    const exhausted = { used: 20, remaining: 0, limit: 20, resetAt: RESET_AT };
    expect(normalizeChatQuota(exhausted)).toEqual(exhausted);
  });

  it.each([null, undefined, "quota", 42, true, []])("rejects a non-object value %j", (value) => {
    expect(normalizeChatQuota(value)).toBeNull();
  });

  it.each(["used", "remaining", "limit", "resetAt"])("rejects a quota missing %s", (key) => {
    const copy: Record<string, unknown> = { ...validQuota };
    delete copy[key];
    expect(normalizeChatQuota(copy)).toBeNull();
  });

  it.each([
    ["negative", -1],
    ["fractional", 1.5],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["numeric string", "5"],
    ["null", null],
  ])("rejects a %s remaining count", (_label, value) => {
    expect(normalizeChatQuota({ ...validQuota, remaining: value })).toBeNull();
  });

  it("rejects a negative used or limit", () => {
    expect(normalizeChatQuota({ ...validQuota, used: -1 })).toBeNull();
    expect(normalizeChatQuota({ ...validQuota, limit: -20 })).toBeNull();
  });

  it.each(["not-a-date", "", 12345, null])("rejects an unparseable resetAt %j", (value) => {
    expect(normalizeChatQuota({ ...validQuota, resetAt: value })).toBeNull();
  });
});

describe("normalizeChatReply", () => {
  it("accepts a valid reply", () => {
    expect(normalizeChatReply(validReply)).toEqual(validReply);
  });

  it("accepts a refused reply", () => {
    const reply = { ...validReply, onTopic: false };
    expect(normalizeChatReply(reply)).toEqual(reply);
  });

  it("drops fields that are not part of the contract", () => {
    expect(normalizeChatReply({ ...validReply, sessionId: "old", fromCache: true })).toEqual(validReply);
  });

  it.each([null, undefined, "reply", 7, []])("rejects a non-object value %j", (value) => {
    expect(normalizeChatReply(value)).toBeNull();
  });

  it.each(["markdown", "onTopic", "remaining", "limit", "resetAt"])("rejects a reply missing %s", (key) => {
    const copy: Record<string, unknown> = { ...validReply };
    delete copy[key];
    expect(normalizeChatReply(copy)).toBeNull();
  });

  it("rejects wrongly typed fields", () => {
    expect(normalizeChatReply({ ...validReply, markdown: 12 })).toBeNull();
    expect(normalizeChatReply({ ...validReply, onTopic: "true" })).toBeNull();
  });

  it("rejects negative, fractional or non-finite counts", () => {
    expect(normalizeChatReply({ ...validReply, remaining: -1 })).toBeNull();
    expect(normalizeChatReply({ ...validReply, limit: 2.5 })).toBeNull();
    expect(normalizeChatReply({ ...validReply, remaining: Number.NaN })).toBeNull();
  });

  it("rejects an unparseable resetAt", () => {
    expect(normalizeChatReply({ ...validReply, resetAt: "tomorrow-ish" })).toBeNull();
  });
});
