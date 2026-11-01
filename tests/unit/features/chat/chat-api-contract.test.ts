import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { PracticeApiError } from "@/features/practice/api";
import { chatErrorKey } from "@/features/chat/chat-errors";
import { quotaFromError } from "@/features/chat/chat-quota";
import { CHAT_EXERCISE_MAX_CHARS } from "@/features/chat/constants";
import { normalizeChatQuota, normalizeChatReply } from "@/features/chat/contracts";

/**
 * Reads the contract file the backend's `ChatApiContractTest` checks against its real responses, so this client
 * and that server are tied to the same sample. It is skipped when the backend repository is not next to this one.
 */
const CONTRACT_PATH = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../../../pte-api/app/src/test/resources/chat/api-contract-v1.json",
);

interface ChatApiContract {
  limits: { exercisePromptMaxChars: number };
  reply: Record<string, unknown>;
  quota: unknown;
  quotaExceededError: { code: string; data: { resetAt: string } };
}

describe.skipIf(!existsSync(CONTRACT_PATH))("chat API contract (shared with the backend)", () => {
  let contract: ChatApiContract;

  beforeAll(() => {
    // Skipped suites are still collected; read the shared fixture only when this suite runs.
    contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8")) as ChatApiContract;
  });

  it("cuts the exercise text at the same length the server accepts", () => {
    expect(CHAT_EXERCISE_MAX_CHARS).toBe(contract.limits.exercisePromptMaxChars);
  });

  it("reads the quota", () => {
    expect(normalizeChatQuota(contract.quota)).toEqual(contract.quota);
  });

  it("reads a reply", () => {
    // The server also sends fromCache and sessionId; this client reads only the fields below.
    const { markdown, onTopic, remaining, limit, resetAt } = contract.reply;
    expect(normalizeChatReply(contract.reply)).toEqual({ markdown, onTopic, remaining, limit, resetAt });
  });

  it("builds the exhausted quota from the quota-exceeded error", () => {
    const { code, data } = contract.quotaExceededError;
    const error = new PracticeApiError("m", 429, code, data);

    expect(quotaFromError(error)).toEqual({ used: 20, remaining: 0, limit: 20, resetAt: data.resetAt });
    expect(chatErrorKey(error)).toBe("quotaExceeded");
  });
});
