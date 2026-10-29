import { PracticeApiError, practiceRequest } from "@/features/practice/api";
import { CHAT_INVALID_RESPONSE_CODE, CHAT_PATHS } from "./constants";
import type { ChatLatestSession, ChatQuota, ChatReply } from "./contracts";
import { normalizeChatQuota, normalizeChatReply, normalizeLatestSession } from "./contracts";

export interface SendChatMessageInput {
  sessionId: string;
  message: string;
  taskType: string | null;
  language: "en" | "vi";
}

export interface ChatApi {
  sendMessage(input: SendChatMessageInput): Promise<ChatReply>;
  getQuota(): Promise<ChatQuota>;
  getLatestSession(): Promise<ChatLatestSession>;
}

function invalidResponse(): PracticeApiError {
  return new PracticeApiError("The chat service returned an unexpected response.", 502, CHAT_INVALID_RESPONSE_CODE);
}

function required<T>(value: T | null): T {
  if (value === null) throw invalidResponse();
  return value;
}

/** `request` is injectable so tests can run without a network; production uses the shared Bearer client. */
export function createChatApi(request: typeof practiceRequest = practiceRequest): ChatApi {
  return {
    async sendMessage(input) {
      return required(normalizeChatReply(await request<unknown>(CHAT_PATHS.messages, { method: "POST", body: input })));
    },
    async getQuota() {
      return required(normalizeChatQuota(await request<unknown>(CHAT_PATHS.quota)));
    },
    async getLatestSession() {
      return required(normalizeLatestSession(await request<unknown>(CHAT_PATHS.latestSession)));
    },
  };
}
