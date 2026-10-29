import { describe, expect, it } from "vitest";
import { en, vi } from "@/common/i18n";
import { CHAT_SUGGESTION_KEYS } from "./chat-suggestions";
import { validateChatInput } from "./chat-input";

type Tree = { [key: string]: unknown };
const suggestions = (dictionary: unknown) => ((dictionary as { chat: { suggestions: Tree } }).chat.suggestions);

describe("chat suggestions", () => {
  it("offers three or four prompts", () => {
    expect(CHAT_SUGGESTION_KEYS.length).toBeGreaterThanOrEqual(3);
    expect(CHAT_SUGGESTION_KEYS.length).toBeLessThanOrEqual(4);
  });

  it.each(CHAT_SUGGESTION_KEYS)("has text for %s in en and vi that the composer would accept", (key) => {
    for (const dictionary of [en, vi]) {
      const text = suggestions(dictionary)[key];
      expect(text).toBeTypeOf("string");
      expect(validateChatInput(text as string).ok).toBe(true);
    }
  });

  it("has no keys in the dictionaries that the list does not know", () => {
    expect(Object.keys(suggestions(en)).sort()).toEqual([...CHAT_SUGGESTION_KEYS].sort());
    expect(Object.keys(suggestions(vi)).sort()).toEqual([...CHAT_SUGGESTION_KEYS].sort());
  });
});
