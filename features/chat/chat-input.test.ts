import { describe, expect, it } from "vitest";
import { CHAT_MAX_INPUT_CHARS } from "./constants";
import { remainingInputChars, validateChatInput } from "./chat-input";

describe("validateChatInput", () => {
  it("accepts a normal question and returns it trimmed", () => {
    expect(validateChatInput("  What is a gerund?  ")).toEqual({ ok: true, text: "What is a gerund?" });
  });

  it("keeps inner whitespace and newlines", () => {
    expect(validateChatInput("line one\n\nline  two")).toEqual({ ok: true, text: "line one\n\nline  two" });
  });

  it.each(["", " ", "   \n\t  "])("rejects empty input %j", (text) => {
    expect(validateChatInput(text)).toEqual({ ok: false, reason: "empty" });
  });

  it("accepts exactly 1000 characters", () => {
    const text = "a".repeat(1000);
    expect(validateChatInput(text)).toEqual({ ok: true, text });
  });

  it("rejects 1001 characters", () => {
    expect(validateChatInput("a".repeat(1001))).toEqual({ ok: false, reason: "too_long" });
  });

  it("measures length after trimming", () => {
    const padded = `   ${"a".repeat(1000)}   `;
    expect(validateChatInput(padded)).toEqual({ ok: true, text: "a".repeat(1000) });
  });

  it("uses the shared limit constant", () => {
    expect(validateChatInput("b".repeat(CHAT_MAX_INPUT_CHARS)).ok).toBe(true);
    expect(validateChatInput("b".repeat(CHAT_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});

describe("remainingInputChars", () => {
  it("is the full limit for empty text", () => {
    expect(remainingInputChars("")).toBe(1000);
  });

  it("counts down as the student types", () => {
    expect(remainingInputChars("hello")).toBe(995);
  });

  it("is zero at the limit", () => {
    expect(remainingInputChars("a".repeat(1000))).toBe(0);
  });

  it("goes negative past the limit", () => {
    expect(remainingInputChars("a".repeat(1005))).toBe(-5);
  });
});
