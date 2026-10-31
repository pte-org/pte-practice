import { describe, expect, it } from "vitest";
import type { ChatQuota, ChatReply } from "@/features/chat/contracts";
import { chatComposerState, chatReducer, INITIAL_CHAT_STATE, type ChatState } from "@/features/chat/chat-state";

const RESET_AT = "2026-10-29T03:00:00Z";

const reply = (overrides: Partial<ChatReply> = {}): ChatReply => ({
  markdown: "Answer **text**",
  onTopic: true,
  remaining: 18,
  limit: 20,
  resetAt: RESET_AT,
  ...overrides,
});

const quota = (remaining: number): ChatQuota => ({ used: 20 - remaining, remaining, limit: 20, resetAt: RESET_AT });

const state = (overrides: Partial<ChatState> = {}): ChatState => ({ ...INITIAL_CHAT_STATE, ...overrides });

describe("INITIAL_CHAT_STATE", () => {
  it("starts with an empty conversation and nothing to load", () => {
    expect(INITIAL_CHAT_STATE).toEqual({
      messages: [],
      pending: false,
      pendingQuestion: null,
      errorKey: null,
      draft: "",
    });
  });
});

describe("chatReducer draft and send lifecycle", () => {
  it("tracks the draft text", () => {
    expect(chatReducer(state(), { type: "draftChanged", text: "hel" }).draft).toBe("hel");
  });

  it("sendStarted marks pending, clears the error and keeps the draft", () => {
    const before = state({ draft: "my question", errorKey: "busy" });
    const after = chatReducer(before, { type: "sendStarted", question: "my question" });

    expect(after.pending).toBe(true);
    expect(after.pendingQuestion).toBe("my question");
    expect(after.errorKey).toBeNull();
    expect(after.draft).toBe("my question");
    expect(after.messages).toEqual(before.messages);
  });

  it("sendSucceeded appends the question and the answer and clears the draft", () => {
    const pending = chatReducer(state({ draft: "Explain gerunds" }), { type: "sendStarted", question: "Explain gerunds" });
    const after = chatReducer(pending, {
      type: "sendSucceeded",
      question: "Explain gerunds",
      reply: reply({ markdown: "A gerund is..." }),
    });

    expect(after.messages.map((m) => [m.role, m.text, m.refused])).toEqual([
      ["user", "Explain gerunds", false],
      ["assistant", "A gerund is...", false],
    ]);
    expect(after.pending).toBe(false);
    expect(after.pendingQuestion).toBeNull();
    expect(after.draft).toBe("");
    expect(after.errorKey).toBeNull();
  });

  it("sendSucceeded marks an off-topic reply as refused", () => {
    const after = chatReducer(state(), {
      type: "sendSucceeded",
      question: "Who won the match?",
      reply: reply({ onTopic: false, markdown: "I can only help with English." }),
    });

    expect(after.messages[after.messages.length - 1].refused).toBe(true);
    expect(after.messages[0].refused).toBe(false);
  });

  it("keeps earlier messages and gives new messages unique ids", () => {
    const first = chatReducer(state(), { type: "sendSucceeded", question: "Q1", reply: reply({ markdown: "A1" }) });
    const second = chatReducer(first, { type: "sendSucceeded", question: "Q2", reply: reply({ markdown: "A2" }) });

    expect(second.messages.map((m) => m.text)).toEqual(["Q1", "A1", "Q2", "A2"]);
    expect(new Set(second.messages.map((m) => m.id)).size).toBe(4);
  });

  it("requestFailed stops pending, sets the error and keeps the draft and messages", () => {
    const base = chatReducer(state(), { type: "sendSucceeded", question: "Q1", reply: reply({ markdown: "A1" }) });
    const typing = chatReducer(base, { type: "draftChanged", text: "second question" });
    const pending = chatReducer(typing, { type: "sendStarted", question: "second question" });
    const after = chatReducer(pending, { type: "requestFailed", errorKey: "busy" });

    expect(after.pending).toBe(false);
    expect(after.pendingQuestion).toBeNull();
    expect(after.errorKey).toBe("busy");
    expect(after.draft).toBe("second question");
    expect(after.messages).toEqual(base.messages);
  });

  it("dismissError clears the error and nothing else", () => {
    const before = state({ errorKey: "network", draft: "keep me" });
    const after = chatReducer(before, { type: "dismissError" });

    expect(after.errorKey).toBeNull();
    expect(after.draft).toBe("keep me");
  });
});

describe("chatReducer newChat", () => {
  it("forgets the conversation, the draft, the error and the waiting question", () => {
    const withMessages = chatReducer(state(), { type: "sendSucceeded", question: "Q", reply: reply() });
    const dirty = { ...withMessages, draft: "half typed", errorKey: "generic" as const };

    expect(chatReducer(dirty, { type: "newChat" })).toEqual(INITIAL_CHAT_STATE);
  });

  it("is ignored while a request is pending", () => {
    const pending = chatReducer(state({ draft: "asking" }), { type: "sendStarted", question: "asking" });

    expect(chatReducer(pending, { type: "newChat" })).toEqual(pending);
  });
});

describe("chatComposerState", () => {
  it("is enabled for a ready draft", () => {
    expect(chatComposerState({ quota: quota(10), pending: false, draft: "What is a gerund?" })).toEqual({
      disabled: false,
      reason: null,
    });
  });

  it("is enabled while the quota is still unknown", () => {
    expect(chatComposerState({ quota: null, pending: false, draft: "hello" })).toEqual({ disabled: false, reason: null });
  });

  it("is enabled for exactly 1000 characters", () => {
    expect(chatComposerState({ quota: quota(5), pending: false, draft: "a".repeat(1000) }).disabled).toBe(false);
  });

  it("reports pending", () => {
    expect(chatComposerState({ quota: quota(10), pending: true, draft: "hello" })).toEqual({
      disabled: true,
      reason: "pending",
    });
  });

  it("reports exhausted", () => {
    expect(chatComposerState({ quota: quota(0), pending: false, draft: "hello" })).toEqual({
      disabled: true,
      reason: "exhausted",
    });
  });

  it("reports too_long", () => {
    expect(chatComposerState({ quota: quota(10), pending: false, draft: "a".repeat(1001) })).toEqual({
      disabled: true,
      reason: "too_long",
    });
  });

  it.each(["", "   ", "\n\t"])("reports empty for draft %j", (draft) => {
    expect(chatComposerState({ quota: quota(10), pending: false, draft })).toEqual({ disabled: true, reason: "empty" });
  });

  it("gives pending priority over exhausted, too_long and empty", () => {
    expect(chatComposerState({ quota: quota(0), pending: true, draft: "a".repeat(2000) }).reason).toBe("pending");
    expect(chatComposerState({ quota: quota(0), pending: true, draft: "" }).reason).toBe("pending");
  });

  it("gives exhausted priority over too_long and empty", () => {
    expect(chatComposerState({ quota: quota(0), pending: false, draft: "a".repeat(2000) }).reason).toBe("exhausted");
    expect(chatComposerState({ quota: quota(0), pending: false, draft: "" }).reason).toBe("exhausted");
  });

  it("gives too_long priority over empty", () => {
    expect(chatComposerState({ quota: quota(3), pending: false, draft: "a".repeat(1001) }).reason).toBe("too_long");
  });
});
