import { describe, expect, it, vi } from "vitest";
import { en, vi as viDictionary } from "@/common/i18n";
import { PracticeApiError, type practiceRequest } from "@/features/practice/api";
import { createChatApi } from "./api";
import {
  canAcceptConsent,
  chatConsentReducer,
  consentBlocksChat,
  INITIAL_CONSENT_STATE,
  type ChatConsentState,
} from "./chat-consent";
import { chatErrorKey } from "./chat-errors";
import { CHAT_CONSENT_ERROR_CODE, CHAT_CONSENT_PATH, CHAT_CONSENT_POLICY_VERSION } from "./constants";
import { normalizeChatConsent } from "./contracts";

type Request = typeof practiceRequest;
const fakeRequest = (result: unknown) => vi.fn().mockResolvedValue(result) as unknown as ReturnType<typeof vi.fn> & Request;

const GRANTED = { policyVersion: CHAT_CONSENT_POLICY_VERSION, consented: true, consentedAt: "2026-10-29T10:00:00Z" };
const REQUIRED = { policyVersion: CHAT_CONSENT_POLICY_VERSION, consented: false };

describe("consent constants", () => {
  it("uses the consent endpoint and the error code the server sends", () => {
    expect(CHAT_CONSENT_PATH).toBe("/api/v1/student/chat/consent");
    expect(CHAT_CONSENT_ERROR_CODE).toBe("CHAT_CONSENT_REQUIRED");
  });

  it("names a policy version", () => {
    expect(CHAT_CONSENT_POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("normalizeChatConsent", () => {
  it("reads a granted consent", () => {
    expect(normalizeChatConsent(GRANTED)).toEqual(GRANTED);
  });

  it("reads a missing consent without a time", () => {
    expect(normalizeChatConsent(REQUIRED)).toEqual({ ...REQUIRED, consentedAt: null });
  });

  it.each([null, "x", 3, [], {}, { policyVersion: "", consented: true }, { policyVersion: "v", consented: "yes" }])(
    "rejects a malformed body (%#)",
    (value) => {
      expect(normalizeChatConsent(value)).toBeNull();
    },
  );
});

describe("createChatApi consent calls", () => {
  it("reads the consent status", async () => {
    const request = fakeRequest(GRANTED);

    await expect(createChatApi(request).getConsent()).resolves.toEqual(GRANTED);
    expect(request).toHaveBeenCalledWith(CHAT_CONSENT_PATH);
  });

  it("posts the accepted version and the age confirmation", async () => {
    const request = fakeRequest(GRANTED);

    await createChatApi(request).acceptConsent(CHAT_CONSENT_POLICY_VERSION);

    expect(request).toHaveBeenCalledWith(CHAT_CONSENT_PATH, {
      method: "POST",
      body: { policyVersion: CHAT_CONSENT_POLICY_VERSION, ageConfirmed: true },
    });
  });

  it("throws CHAT_INVALID_RESPONSE with status 502 when the answer is malformed", async () => {
    await expect(createChatApi(fakeRequest({ nope: 1 })).getConsent()).rejects.toMatchObject({
      status: 502,
      code: "CHAT_INVALID_RESPONSE",
    });
  });
});

describe("chatErrorKey for consent", () => {
  it("maps the consent code to consentRequired whatever the status", () => {
    expect(chatErrorKey(new PracticeApiError("m", 403, "CHAT_CONSENT_REQUIRED"))).toBe("consentRequired");
  });

  it("still maps a plain 403 to generic", () => {
    expect(chatErrorKey(new PracticeApiError("forbidden", 403, "FORBIDDEN"))).toBe("generic");
  });
});

describe("chatConsentReducer", () => {
  const reduce = (state: ChatConsentState, ...actions: Parameters<typeof chatConsentReducer>[1][]) =>
    actions.reduce(chatConsentReducer, state);

  it("starts loading, blocking chat", () => {
    expect(INITIAL_CONSENT_STATE.status).toBe("loading");
    expect(consentBlocksChat(INITIAL_CONSENT_STATE.status)).toBe(true);
  });

  it("opens chat when the server already has the consent", () => {
    const state = reduce(INITIAL_CONSENT_STATE, { type: "loaded", consent: normalizeChatConsent(GRANTED)! });

    expect(state.status).toBe("granted");
    expect(consentBlocksChat(state.status)).toBe(false);
  });

  it("asks when the server has no consent for this version", () => {
    const state = reduce(INITIAL_CONSENT_STATE, { type: "loaded", consent: normalizeChatConsent(REQUIRED)! });

    expect(state.status).toBe("required");
    expect(consentBlocksChat(state.status)).toBe(true);
  });

  it("keeps chat closed and offers a retry when the status could not be read", () => {
    const state = reduce(INITIAL_CONSENT_STATE, { type: "loadFailed", errorKey: "network" });

    expect(state.status).toBe("failed");
    expect(state.errorKey).toBe("network");
    expect(consentBlocksChat(state.status)).toBe(true);
  });

  it("cannot be accepted until the age box is ticked", () => {
    const required = reduce(INITIAL_CONSENT_STATE, { type: "loaded", consent: normalizeChatConsent(REQUIRED)! });
    expect(canAcceptConsent(required)).toBe(false);

    const ticked = reduce(required, { type: "ageToggled", checked: true });
    expect(canAcceptConsent(ticked)).toBe(true);

    expect(canAcceptConsent(reduce(ticked, { type: "ageToggled", checked: false }))).toBe(false);
  });

  it("cannot be accepted while a request is already running", () => {
    const state = reduce(
      INITIAL_CONSENT_STATE,
      { type: "loaded", consent: normalizeChatConsent(REQUIRED)! },
      { type: "ageToggled", checked: true },
      { type: "acceptStarted" },
    );

    expect(state.pending).toBe(true);
    expect(canAcceptConsent(state)).toBe(false);
  });

  it("opens chat after a successful accept", () => {
    const state = reduce(
      INITIAL_CONSENT_STATE,
      { type: "loaded", consent: normalizeChatConsent(REQUIRED)! },
      { type: "ageToggled", checked: true },
      { type: "acceptStarted" },
      { type: "acceptSucceeded" },
    );

    expect(state.status).toBe("granted");
    expect(state.pending).toBe(false);
  });

  it("stays on the consent view and shows the error when accepting fails, keeping the tick", () => {
    const state = reduce(
      INITIAL_CONSENT_STATE,
      { type: "loaded", consent: normalizeChatConsent(REQUIRED)! },
      { type: "ageToggled", checked: true },
      { type: "acceptStarted" },
      { type: "acceptFailed", errorKey: "network" },
    );

    expect(state.status).toBe("required");
    expect(state.pending).toBe(false);
    expect(state.errorKey).toBe("network");
    expect(state.ageChecked).toBe(true);
  });

  it("goes back to asking when a send is refused for missing consent", () => {
    const granted = reduce(INITIAL_CONSENT_STATE, { type: "loaded", consent: normalizeChatConsent(GRANTED)! });

    const state = reduce(granted, { type: "required" });

    expect(state.status).toBe("required");
    expect(state.ageChecked).toBe(false);
  });

  it("clears an earlier error when the student tries again", () => {
    const failed = reduce(
      INITIAL_CONSENT_STATE,
      { type: "loaded", consent: normalizeChatConsent(REQUIRED)! },
      { type: "acceptFailed", errorKey: "busy" },
    );

    expect(reduce(failed, { type: "acceptStarted" }).errorKey).toBeNull();
  });
});

describe("consent copy", () => {
  type Tree = Record<string, unknown>;
  const consent = (dictionary: unknown) => (dictionary as { chat: { consent: Tree } }).chat.consent;

  it.each(["title", "point1", "point2", "point3", "policyLink", "ageLabel", "accept", "retry"])("defines chat.consent.%s in en and vi", (key) => {
    for (const dictionary of [en, viDictionary]) {
      expect(consent(dictionary)[key]).toBeTypeOf("string");
      expect((consent(dictionary)[key] as string).trim()).not.toBe("");
    }
  });

  it("defines the consentRequired error in en and vi", () => {
    for (const dictionary of [en, viDictionary]) {
      const errors = (dictionary as unknown as { chat: { errors: Tree } }).chat.errors;
      expect(errors.consentRequired).toBeTypeOf("string");
    }
  });

  it("states the 16-year age or guardian condition and the 12-month retention in both languages", () => {
    expect(consent(en).ageLabel).toMatch(/16/);
    expect(consent(viDictionary).ageLabel).toMatch(/16/);
    expect(consent(en).point1).toMatch(/12 months/);
    expect(consent(viDictionary).point1).toMatch(/12 tháng/);
  });

  it("tells students their text goes to Google, and not to share personal data", () => {
    expect(consent(en).point2).toMatch(/Google/);
    expect(consent(viDictionary).point2).toMatch(/Google/);
    expect(consent(en).point3).toMatch(/personal/i);
    expect(consent(viDictionary).point3).toMatch(/cá nhân/);
  });

  it("warns that what is typed cannot be taken back from Google once sent", () => {
    expect(consent(en).point3).toMatch(/cannot take it back/i);
    expect(consent(viDictionary).point3).toMatch(/không thể thu hồi/);
  });
});
