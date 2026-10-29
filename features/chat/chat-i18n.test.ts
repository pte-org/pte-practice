import { describe, expect, it } from "vitest";
import { en, vi } from "@/common/i18n";

const VI_DISCLAIMER = "Đoạn chat được lưu lại để kiểm tra chất lượng dịch vụ và cải thiện AI. Đừng chia sẻ thông tin cá nhân.";

const REQUIRED_KEYS = [
  "title",
  "toggleOpen",
  "toggleClose",
  "newChat",
  "placeholder",
  "send",
  "thinking",
  "emptyState",
  "quotaLeft",
  "quotaWarning",
  "quotaExhausted",
  "resetIn",
  "charCount",
  "tooLong",
  "emptyInput",
  "disclaimer",
  "refusedLabel",
  "copy",
  "copied",
  "suggestionsTitle",
  "badgeLabel",
  "shortcutHint",
  "quotaRefreshing",
];

const REQUIRED_ERROR_KEYS = ["quotaExceeded", "inFlight", "busy", "sessionNotFound", "invalidRequest", "network", "generic"];

type Tree = { [key: string]: unknown };

function leaves(value: unknown, prefix = ""): Array<[string, unknown]> {
  if (value === undefined) return [];
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return Object.entries(value as Tree).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [[prefix, value]];
}

const placeholders = (text: string) => [...text.matchAll(/\{[A-Za-z0-9_]+\}/g)].map((m) => m[0]).sort();

const enChat = (en as unknown as { chat?: Tree }).chat;
const viChat = (vi as unknown as { chat?: Tree }).chat;

describe("chat i18n", () => {
  it("defines the chat section in both dictionaries", () => {
    expect(enChat).toBeTypeOf("object");
    expect(viChat).toBeTypeOf("object");
  });

  it.each(REQUIRED_KEYS)("defines chat.%s as a non-empty string in en and vi", (key) => {
    expect(enChat?.[key]).toBeTypeOf("string");
    expect((enChat?.[key] as string).trim()).not.toBe("");
    expect(viChat?.[key]).toBeTypeOf("string");
    expect((viChat?.[key] as string).trim()).not.toBe("");
  });

  it.each(REQUIRED_ERROR_KEYS)("defines chat.errors.%s as a non-empty string in en and vi", (key) => {
    const enErrors = enChat?.errors as Tree | undefined;
    const viErrors = viChat?.errors as Tree | undefined;
    expect(enErrors?.[key]).toBeTypeOf("string");
    expect((enErrors?.[key] as string).trim()).not.toBe("");
    expect(viErrors?.[key]).toBeTypeOf("string");
    expect((viErrors?.[key] as string).trim()).not.toBe("");
  });

  it("has only non-empty string leaves in both dictionaries", () => {
    for (const chat of [enChat, viChat]) {
      expect(leaves(chat).length).toBeGreaterThan(0);
      for (const [path, value] of leaves(chat)) {
        expect(value, path).toBeTypeOf("string");
        expect((value as string).trim(), path).not.toBe("");
      }
    }
  });

  it("has exactly the same key set in en and vi", () => {
    const enKeys = leaves(enChat).map(([path]) => path).sort();
    const viKeys = leaves(viChat).map(([path]) => path).sort();
    expect(enKeys.length).toBeGreaterThan(0);
    expect(viKeys).toEqual(enKeys);
  });

  it("uses the same interpolation tokens in en and vi for every key", () => {
    const viLeaves = new Map(leaves(viChat));
    expect(leaves(enChat).length).toBeGreaterThan(0);
    for (const [path, value] of leaves(enChat)) {
      expect(placeholders(String(viLeaves.get(path))), path).toEqual(placeholders(String(value)));
    }
  });

  it("uses the approved Vietnamese disclaimer verbatim", () => {
    expect(viChat?.disclaimer).toBe(VI_DISCLAIMER);
  });

  it("keeps the English disclaimer different from the Vietnamese one", () => {
    expect(enChat?.disclaimer).toBeTypeOf("string");
    expect(enChat?.disclaimer).not.toBe(VI_DISCLAIMER);
  });
});
