import { describe, expect, it } from "vitest";
import { isChatToggleShortcut } from "@/features/chat/chat-shortcut";

const base = { key: "/", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false, isComposing: false };

describe("isChatToggleShortcut", () => {
  it("matches Ctrl+/", () => {
    expect(isChatToggleShortcut(base)).toBe(true);
  });

  it("matches Cmd+/ on a Mac", () => {
    expect(isChatToggleShortcut({ ...base, ctrlKey: false, metaKey: true })).toBe(true);
  });

  it("ignores a plain slash, which students type into answers", () => {
    expect(isChatToggleShortcut({ ...base, ctrlKey: false })).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isChatToggleShortcut({ ...base, key: "k" })).toBe(false);
  });

  it("ignores combinations with Alt or Shift", () => {
    expect(isChatToggleShortcut({ ...base, altKey: true })).toBe(false);
    expect(isChatToggleShortcut({ ...base, shiftKey: true })).toBe(false);
  });

  it("ignores keys pressed while an input method is composing", () => {
    expect(isChatToggleShortcut({ ...base, isComposing: true })).toBe(false);
  });
});
