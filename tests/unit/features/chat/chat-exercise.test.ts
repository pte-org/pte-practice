import { describe, expect, it } from "vitest";
import { buildSendInput, exerciseContextFrom } from "@/features/chat/chat-exercise";
import { CHAT_EXERCISE_MAX_CHARS } from "@/features/chat/constants";

describe("exerciseContextFrom", () => {
  it.each([null, undefined, "", "   ", "\n\t "])("returns null when there is no exercise text (%j)", (value) => {
    expect(exerciseContextFrom(value)).toBeNull();
  });

  it("returns the text trimmed", () => {
    expect(exerciseContextFrom("  Some people believe technology makes us less social.\n")).toBe(
      "Some people believe technology makes us less social.",
    );
  });

  it("collapses runs of spaces and blank lines so the budget is not wasted", () => {
    expect(exerciseContextFrom("a   b\t\tc\n\n\n\nd")).toBe("a b c\n\nd");
  });

  it("cuts a long text at a word boundary within the limit", () => {
    const text = "word ".repeat(1000);
    const result = exerciseContextFrom(text) ?? "";

    expect(result.length).toBeLessThanOrEqual(CHAT_EXERCISE_MAX_CHARS);
    expect(result.endsWith("word")).toBe(true);
    expect(result.length).toBeGreaterThan(CHAT_EXERCISE_MAX_CHARS - 10);
  });

  it("keeps a text that is exactly at the limit whole", () => {
    const text = "a".repeat(CHAT_EXERCISE_MAX_CHARS);

    expect(exerciseContextFrom(text)).toBe(text);
  });

  it("cuts a single very long word at the limit", () => {
    expect(exerciseContextFrom("x".repeat(CHAT_EXERCISE_MAX_CHARS + 50))).toHaveLength(CHAT_EXERCISE_MAX_CHARS);
  });
});

describe("buildSendInput", () => {
  const base = { message: "How do I say it?", taskType: "WRITE_ESSAY", language: "en" as const };
  const history = [
    { role: "user" as const, text: "What is a gerund?" },
    { role: "assistant" as const, text: "A verb form ending in -ing." },
  ];

  it("adds the exercise text when there is one", () => {
    expect(buildSendInput({ ...base, exercisePrompt: "Technology makes us less social." })).toEqual({
      ...base,
      exercisePrompt: "Technology makes us less social.",
    });
  });

  it.each([null, undefined])("leaves the field out when the exercise is %s", (exercisePrompt) => {
    const input = buildSendInput({ ...base, exercisePrompt });

    expect(input).toEqual(base);
    expect("exercisePrompt" in input).toBe(false);
  });

  it("adds the earlier turns when there are any", () => {
    expect(buildSendInput({ ...base, history })).toEqual({ ...base, history });
  });

  it.each([undefined, []])("leaves the history out for a first question (%j)", (value) => {
    const input = buildSendInput({ ...base, history: value });

    expect(input).toEqual(base);
    expect("history" in input).toBe(false);
  });

  it("sends nothing about a session, because the server keeps none", () => {
    expect(Object.keys(buildSendInput({ ...base, exercisePrompt: "text", history })).sort()).toEqual([
      "exercisePrompt",
      "history",
      "language",
      "message",
      "taskType",
    ]);
  });
});
