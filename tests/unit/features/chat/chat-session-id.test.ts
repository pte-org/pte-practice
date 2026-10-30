import { afterEach, describe, expect, it, vi } from "vitest";
import { createChatSessionId, isUuidV4 } from "@/features/chat/chat-session-id";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isUuidV4", () => {
  it("accepts a v4 UUID in either case", () => {
    expect(isUuidV4("0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7b")).toBe(true);
    expect(isUuidV4("0B8F2C3E-6D4A-4F7E-8C1B-2A3D4E5F6A7B")).toBe(true);
  });

  it.each([
    ["wrong version", "0b8f2c3e-6d4a-1f7e-9c1b-2a3d4e5f6a7b"],
    ["wrong variant", "0b8f2c3e-6d4a-4f7e-0c1b-2a3d4e5f6a7b"],
    ["too short", "0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7"],
    ["no dashes", "0b8f2c3e6d4a4f7e9c1b2a3d4e5f6a7b"],
    ["non-hex", "0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7z"],
    ["trailing space", "0b8f2c3e-6d4a-4f7e-9c1b-2a3d4e5f6a7b "],
    ["empty", ""],
  ])("rejects %s", (_label, value) => {
    expect(isUuidV4(value)).toBe(false);
  });

  it.each([null, undefined, 42, {}, []])("rejects the non-string %j", (value) => {
    expect(isUuidV4(value)).toBe(false);
  });
});

describe("createChatSessionId", () => {
  it("returns a v4 UUID", () => {
    expect(isUuidV4(createChatSessionId())).toBe(true);
  });

  it("returns a different id on every call", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createChatSessionId()));
    expect(ids.size).toBe(50);
  });

  it("uses crypto.randomUUID when available", () => {
    const fixed = "11111111-2222-4333-8444-555555555555";
    vi.stubGlobal("crypto", { randomUUID: () => fixed });
    expect(createChatSessionId()).toBe(fixed);
  });

  it("falls back to a valid v4 UUID without crypto.randomUUID", () => {
    const realCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: realCrypto.getRandomValues.bind(realCrypto) });
    const first = createChatSessionId();
    const second = createChatSessionId();
    expect(isUuidV4(first)).toBe(true);
    expect(isUuidV4(second)).toBe(true);
    expect(first).not.toBe(second);
  });

  it("falls back to a valid v4 UUID when crypto is missing entirely", () => {
    vi.stubGlobal("crypto", undefined);
    expect(isUuidV4(createChatSessionId())).toBe(true);
  });
});
