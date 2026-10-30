import { describe, expect, it } from "vitest";
import { normalizeChatQuota, normalizeChatReply, normalizeLatestSession } from "@/features/chat/contracts";

const RESET_AT = "2026-10-29T03:00:00Z";

const validQuota = { used: 5, remaining: 15, limit: 20, resetAt: RESET_AT };
const validReply = {
  markdown: "**Hello**",
  onTopic: true,
  fromCache: false,
  remaining: 14,
  limit: 20,
  resetAt: RESET_AT,
  sessionId: "0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7b",
};
const validItem = { question: "What is a gerund?", answer: "A **verb** form.", status: "OK", createdAt: "2026-10-28T10:00:00Z" };

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

  it("accepts a refused, cached reply", () => {
    const reply = { ...validReply, onTopic: false, fromCache: true };
    expect(normalizeChatReply(reply)).toEqual(reply);
  });

  it.each([null, undefined, "reply", 7, []])("rejects a non-object value %j", (value) => {
    expect(normalizeChatReply(value)).toBeNull();
  });

  it.each(["markdown", "onTopic", "fromCache", "remaining", "limit", "resetAt", "sessionId"])(
    "rejects a reply missing %s",
    (key) => {
      const copy: Record<string, unknown> = { ...validReply };
      delete copy[key];
      expect(normalizeChatReply(copy)).toBeNull();
    },
  );

  it("rejects wrongly typed fields", () => {
    expect(normalizeChatReply({ ...validReply, markdown: 12 })).toBeNull();
    expect(normalizeChatReply({ ...validReply, onTopic: "true" })).toBeNull();
    expect(normalizeChatReply({ ...validReply, fromCache: 0 })).toBeNull();
    expect(normalizeChatReply({ ...validReply, sessionId: 5 })).toBeNull();
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

describe("normalizeLatestSession", () => {
  it("accepts a session with history", () => {
    const refused = { ...validItem, question: "Who won the match?", answer: "I can only help with English.", status: "REFUSED" };
    const failed = { ...validItem, status: "FAILED" };
    const value = { sessionId: validReply.sessionId, messages: [validItem, refused, failed] };
    expect(normalizeLatestSession(value)).toEqual(value);
  });

  it("accepts a student with no session yet", () => {
    expect(normalizeLatestSession({ sessionId: null, messages: [] })).toEqual({ sessionId: null, messages: [] });
  });

  it.each([null, undefined, "session", 3, []])("rejects a non-object value %j", (value) => {
    expect(normalizeLatestSession(value)).toBeNull();
  });

  it("rejects a sessionId that is neither a string nor null", () => {
    expect(normalizeLatestSession({ sessionId: 42, messages: [] })).toBeNull();
    expect(normalizeLatestSession({ sessionId: {}, messages: [] })).toBeNull();
  });

  it.each([undefined, null, "oops", 5, { 0: validItem }])("treats non-array messages %j as empty", (messages) => {
    expect(normalizeLatestSession({ sessionId: validReply.sessionId, messages })).toEqual({
      sessionId: validReply.sessionId,
      messages: [],
    });
  });

  it("drops invalid items but keeps the valid ones in order", () => {
    const second = { ...validItem, question: "Second?" };
    const result = normalizeLatestSession({
      sessionId: validReply.sessionId,
      messages: [
        validItem,
        null,
        "text",
        { ...validItem, question: 42 },
        { question: "no answer", status: "OK", createdAt: validItem.createdAt },
        { ...validItem, createdAt: undefined },
        second,
      ],
    });
    expect(result?.messages).toEqual([validItem, second]);
  });

  it.each(["PENDING", "ok", "", null, 1])("drops an item with unknown status %j", (status) => {
    const result = normalizeLatestSession({
      sessionId: validReply.sessionId,
      messages: [{ ...validItem, status }, validItem],
    });
    expect(result?.messages).toEqual([validItem]);
  });
});
