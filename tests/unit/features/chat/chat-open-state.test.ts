import { describe, expect, it } from "vitest";
import { CHAT_OPEN_STORAGE_KEY } from "@/features/chat/constants";
import { readChatOpen, writeChatOpen, type ChatStorage } from "@/features/chat/chat-open-state";

function memoryStorage(initial: Record<string, string> = {}): ChatStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const throwing: ChatStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("chat open state", () => {
  it("is closed when nothing was stored", () => {
    expect(readChatOpen(memoryStorage())).toBe(false);
  });

  it("remembers an open panel", () => {
    const storage = memoryStorage();
    writeChatOpen(storage, true);
    expect(storage.data[CHAT_OPEN_STORAGE_KEY]).toBe("1");
    expect(readChatOpen(storage)).toBe(true);
  });

  it("remembers a closed panel", () => {
    const storage = memoryStorage();
    writeChatOpen(storage, true);
    writeChatOpen(storage, false);
    expect(readChatOpen(storage)).toBe(false);
  });

  it("treats any unexpected stored value as closed", () => {
    expect(readChatOpen(memoryStorage({ [CHAT_OPEN_STORAGE_KEY]: "yes" }))).toBe(false);
  });

  it("never throws when storage is blocked", () => {
    expect(readChatOpen(throwing)).toBe(false);
    expect(() => writeChatOpen(throwing, true)).not.toThrow();
  });

  it("is closed and silent when there is no storage at all", () => {
    expect(readChatOpen(null)).toBe(false);
    expect(() => writeChatOpen(null, true)).not.toThrow();
  });
});
