import { describe, expect, it } from "vitest";
import { createChatApi } from "@/features/chat/api";
import { isChatUnavailable } from "@/features/chat/chat-availability";
import { CHAT_PATHS } from "@/features/chat/constants";
import type { practiceRequest } from "@/features/practice/api";

const quota = { used: 1, remaining: 19, limit: 20, resetAt: "2026-11-29T00:00:00Z", unlimited: false };

function requestWith(capabilities: unknown): typeof practiceRequest {
  return (async (path: string) => {
    if (path === CHAT_PATHS.aiCapabilities) {
      if (capabilities instanceof Error) throw capabilities;
      return capabilities;
    }
    return quota;
  }) as typeof practiceRequest;
}

describe("chat quota read beside the admin's AI chat switch", () => {
  it("fails as unavailable when the admin has the chat off", async () => {
    const error = await createChatApi(requestWith({ chat: false })).getQuota().catch((e: unknown) => e);
    expect(isChatUnavailable(error)).toBe(true);
  });

  it("returns the quota when the chat is on or the switch cannot be read", async () => {
    await expect(createChatApi(requestWith({ chat: true })).getQuota()).resolves.toBeTruthy();
    await expect(createChatApi(requestWith(new Error("down"))).getQuota()).resolves.toBeTruthy();
  });
});
