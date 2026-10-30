import { describe, expect, it } from "vitest";
import type { ChatHistoryItem, ChatQuota, ChatReply } from "@/features/chat/contracts";
import { chatComposerState, chatReducer, INITIAL_CHAT_STATE, type ChatState } from "@/features/chat/chat-state";

const RESET_AT = "2026-10-29T03:00:00Z";
const OLD_ID = "0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7b";
const NEW_ID = "11111111-2222-4333-8444-555555555555";

const item = (overrides: Partial<ChatHistoryItem> = {}): ChatHistoryItem => ({
  question: "What is a gerund?",
  answer: "A verb form ending in -ing.",
  status: "OK",
  createdAt: "2026-10-28T10:00:00Z",
  ...overrides,
});

const reply = (overrides: Partial<ChatReply> = {}): ChatReply => ({
  markdown: "Answer **text**",
  onTopic: true,
  fromCache: false,
  remaining: 18,
  limit: 20,
  resetAt: RESET_AT,
  sessionId: OLD_ID,
  ...overrides,
});

const quota = (remaining: number): ChatQuota => ({ used: 20 - remaining, remaining, limit: 20, resetAt: RESET_AT });

const loadedState = (overrides: Partial<ChatState> = {}): ChatState => ({
  ...INITIAL_CHAT_STATE,
  sessionId: OLD_ID,
  loaded: true,
  ...overrides,
});

describe("INITIAL_CHAT_STATE", () => {
  it("starts empty and not loaded", () => {
    expect(INITIAL_CHAT_STATE).toEqual({
      sessionId: null,
      messages: [],
      pending: false,
      pendingQuestion: null,
      errorKey: null,
      draft: "",
      loaded: false,
    });
  });
});

describe("chatReducer loaded", () => {
  it("adopts the server session id and turns history into user and assistant views", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "loaded",
      session: { sessionId: OLD_ID, messages: [item({ question: "Q1", answer: "A1" }), item({ question: "Q2", answer: "A2" })] },
      newSessionId: NEW_ID,
    });

    expect(state.sessionId).toBe(OLD_ID);
    expect(state.loaded).toBe(true);
    expect(state.messages.map((m) => [m.role, m.text, m.refused])).toEqual([
      ["user", "Q1", false],
      ["assistant", "A1", false],
      ["user", "Q2", false],
      ["assistant", "A2", false],
    ]);
  });

  it("uses the generated id for a student with no session yet", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "loaded",
      session: { sessionId: null, messages: [] },
      newSessionId: NEW_ID,
    });

    expect(state.sessionId).toBe(NEW_ID);
    expect(state.messages).toEqual([]);
    expect(state.loaded).toBe(true);
  });

  it("marks refused history answers and drops failed items", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "loaded",
      session: {
        sessionId: OLD_ID,
        messages: [
          item({ question: "Off topic?", answer: "I only help with English.", status: "REFUSED" }),
          item({ question: "Lost", answer: "", status: "FAILED" }),
          item({ question: "Fine", answer: "Sure", status: "OK" }),
        ],
      },
      newSessionId: NEW_ID,
    });

    expect(state.messages.map((m) => [m.role, m.text, m.refused])).toEqual([
      ["user", "Off topic?", false],
      ["assistant", "I only help with English.", true],
      ["user", "Fine", false],
      ["assistant", "Sure", false],
    ]);
  });

  it("gives every message a unique, stable id", () => {
    const action = {
      type: "loaded" as const,
      session: { sessionId: OLD_ID, messages: [item(), item(), item({ status: "REFUSED" })] },
      newSessionId: NEW_ID,
    };
    const first = chatReducer(INITIAL_CHAT_STATE, action);
    const second = chatReducer(INITIAL_CHAT_STATE, action);

    const ids = first.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(second.messages.map((m) => m.id)).toEqual(ids);
  });
});

describe("chatReducer draft and send lifecycle", () => {
  it("tracks the draft text", () => {
    const state = chatReducer(loadedState(), { type: "draftChanged", text: "hel" });
    expect(state.draft).toBe("hel");
  });

  it("sendStarted marks pending, clears the error and keeps the draft", () => {
    const before = loadedState({ draft: "my question", errorKey: "busy" });
    const state = chatReducer(before, { type: "sendStarted", question: "my question" });

    expect(state.pending).toBe(true);
    expect(state.pendingQuestion).toBe("my question");
    expect(state.errorKey).toBeNull();
    expect(state.draft).toBe("my question");
    expect(state.messages).toEqual(before.messages);
  });

  it("sendSucceeded appends the question and the answer, clears the draft and adopts the session", () => {
    const pending = chatReducer(
      loadedState({ draft: "Explain gerunds", sessionId: NEW_ID }),
      { type: "sendStarted", question: "Explain gerunds" },
    );
    const state = chatReducer(pending, {
      type: "sendSucceeded",
      question: "Explain gerunds",
      reply: reply({ markdown: "A gerund is...", sessionId: OLD_ID }),
    });

    expect(state.messages.map((m) => [m.role, m.text, m.refused])).toEqual([
      ["user", "Explain gerunds", false],
      ["assistant", "A gerund is...", false],
    ]);
    expect(state.pending).toBe(false);
    expect(state.pendingQuestion).toBeNull();
    expect(state.draft).toBe("");
    expect(state.errorKey).toBeNull();
    expect(state.sessionId).toBe(OLD_ID);
  });

  it("sendSucceeded marks an off-topic reply as refused", () => {
    const state = chatReducer(loadedState(), {
      type: "sendSucceeded",
      question: "Who won the match?",
      reply: reply({ onTopic: false, markdown: "I can only help with English." }),
    });

    const assistant = state.messages[state.messages.length - 1];
    expect(assistant.role).toBe("assistant");
    expect(assistant.refused).toBe(true);
    expect(state.messages[0].refused).toBe(false);
  });

  it("keeps earlier messages and gives new messages unique ids", () => {
    const first = chatReducer(loadedState(), { type: "sendSucceeded", question: "Q1", reply: reply({ markdown: "A1" }) });
    const second = chatReducer(first, { type: "sendSucceeded", question: "Q2", reply: reply({ markdown: "A2" }) });

    expect(second.messages.map((m) => m.text)).toEqual(["Q1", "A1", "Q2", "A2"]);
    const ids = second.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(4);
  });

  it("requestFailed stops pending, sets the error and keeps the draft and messages", () => {
    const base = chatReducer(loadedState(), { type: "sendSucceeded", question: "Q1", reply: reply({ markdown: "A1" }) });
    const typing = chatReducer(base, { type: "draftChanged", text: "second question" });
    const pending = chatReducer(typing, { type: "sendStarted", question: "second question" });
    const state = chatReducer(pending, { type: "requestFailed", errorKey: "busy" });

    expect(state.pending).toBe(false);
    expect(state.pendingQuestion).toBeNull();
    expect(state.errorKey).toBe("busy");
    expect(state.draft).toBe("second question");
    expect(state.messages).toEqual(base.messages);
  });

  it("dismissError clears the error and nothing else", () => {
    const before = loadedState({ errorKey: "network", draft: "keep me" });
    const state = chatReducer(before, { type: "dismissError" });

    expect(state.errorKey).toBeNull();
    expect(state.draft).toBe("keep me");
    expect(state.sessionId).toBe(before.sessionId);
  });
});

describe("chatReducer newChat", () => {
  it("replaces the session and clears messages, draft, error and pending question", () => {
    const withMessages = chatReducer(loadedState(), { type: "sendSucceeded", question: "Q", reply: reply() });
    const dirty = { ...withMessages, draft: "half typed", errorKey: "generic" as const };
    const state = chatReducer(dirty, { type: "newChat", sessionId: NEW_ID });

    expect(state.sessionId).toBe(NEW_ID);
    expect(state.messages).toEqual([]);
    expect(state.draft).toBe("");
    expect(state.errorKey).toBeNull();
    expect(state.pendingQuestion).toBeNull();
    expect(state.pending).toBe(false);
  });

  it("is ignored while a request is pending", () => {
    const pending = chatReducer(loadedState({ draft: "asking" }), { type: "sendStarted", question: "asking" });
    const state = chatReducer(pending, { type: "newChat", sessionId: NEW_ID });

    expect(state).toEqual(pending);
    expect(state.sessionId).toBe(OLD_ID);
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
