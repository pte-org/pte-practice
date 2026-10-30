import { describe, expect, it, vi } from "vitest";
import { en, vi as viDictionary } from "@/common/i18n";
import type { practiceRequest } from "@/features/practice/api";
import { createChatApi } from "@/features/chat/api";
import { chatPrivacyReducer, INITIAL_PRIVACY_STATE, type ChatPrivacyState } from "@/features/chat/chat-privacy";
import { CHAT_CONSENT_PATH, CHAT_HISTORY_PATH } from "@/features/chat/constants";

type Request = typeof practiceRequest;
const fakeRequest = (result: unknown) => vi.fn().mockResolvedValue(result) as unknown as ReturnType<typeof vi.fn> & Request;

describe("privacy api calls", () => {
  it("withdraws consent with a DELETE and reads the new status", async () => {
    const request = fakeRequest({ policyVersion: "2026-10-29", consented: false });

    await expect(createChatApi(request).withdrawConsent()).resolves.toEqual({
      policyVersion: "2026-10-29",
      consented: false,
      consentedAt: null,
    });
    expect(request).toHaveBeenCalledWith(CHAT_CONSENT_PATH, { method: "DELETE" });
  });

  it("deletes the history with a DELETE", async () => {
    const request = fakeRequest({ deletedMessages: 4 });

    await expect(createChatApi(request).deleteHistory()).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(CHAT_HISTORY_PATH, { method: "DELETE" });
  });

  it("uses the history endpoint of the chat API", () => {
    expect(CHAT_HISTORY_PATH).toBe("/api/v1/student/chat/history");
  });
});

describe("chatPrivacyReducer", () => {
  const reduce = (state: ChatPrivacyState, ...actions: Parameters<typeof chatPrivacyReducer>[1][]) =>
    actions.reduce(chatPrivacyReducer, state);

  it("starts with nothing to confirm", () => {
    expect(INITIAL_PRIVACY_STATE).toEqual({ confirming: null, pending: false, errorKey: null });
  });

  it("asks for a confirmation before doing anything", () => {
    expect(reduce(INITIAL_PRIVACY_STATE, { type: "ask", action: "delete" }).confirming).toBe("delete");
    expect(reduce(INITIAL_PRIVACY_STATE, { type: "ask", action: "withdraw" }).confirming).toBe("withdraw");
  });

  it("can be cancelled", () => {
    const state = reduce(INITIAL_PRIVACY_STATE, { type: "ask", action: "delete" }, { type: "cancel" });

    expect(state).toEqual(INITIAL_PRIVACY_STATE);
  });

  it("is pending while the request runs and ignores new questions meanwhile", () => {
    const running = reduce(INITIAL_PRIVACY_STATE, { type: "ask", action: "delete" }, { type: "started" });

    expect(running.pending).toBe(true);
    expect(reduce(running, { type: "ask", action: "withdraw" }).confirming).toBe("delete");
    expect(reduce(running, { type: "cancel" }).pending).toBe(true);
  });

  it("returns to the start after success", () => {
    const state = reduce(INITIAL_PRIVACY_STATE, { type: "ask", action: "delete" }, { type: "started" }, { type: "succeeded" });

    expect(state).toEqual(INITIAL_PRIVACY_STATE);
  });

  it("keeps the confirmation open and shows the error after a failure, so the student can retry", () => {
    const state = reduce(
      INITIAL_PRIVACY_STATE,
      { type: "ask", action: "withdraw" },
      { type: "started" },
      { type: "failed", errorKey: "network" },
    );

    expect(state).toEqual({ confirming: "withdraw", pending: false, errorKey: "network" });
  });

  it("clears an earlier error when asking again", () => {
    const failed = reduce(INITIAL_PRIVACY_STATE, { type: "ask", action: "delete" }, { type: "failed", errorKey: "busy" });

    expect(reduce(failed, { type: "cancel" }).errorKey).toBeNull();
    expect(reduce(failed, { type: "started" }).errorKey).toBeNull();
  });
});

describe("privacy copy", () => {
  type Tree = Record<string, unknown>;
  const privacy = (dictionary: unknown) => (dictionary as { chat: { privacy: Tree } }).chat.privacy;

  it.each(["withdraw", "delete", "confirmWithdraw", "confirmDelete", "confirm", "cancel"])(
    "defines chat.privacy.%s in en and vi",
    (key) => {
      for (const dictionary of [en, viDictionary]) {
        expect(privacy(dictionary)[key]).toBeTypeOf("string");
        expect((privacy(dictionary)[key] as string).trim()).not.toBe("");
      }
    },
  );

  it("says deleting cannot be undone and does not give back today's questions", () => {
    expect(privacy(en).confirmDelete).toMatch(/cannot be undone/i);
    expect(privacy(viDictionary).confirmDelete).toMatch(/không thể hoàn tác/);
    expect(privacy(en).confirmDelete).toMatch(/questions/i);
    expect(privacy(viDictionary).confirmDelete).toMatch(/lượt/);
  });
});
