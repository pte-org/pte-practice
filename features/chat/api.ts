import { PracticeApiError, practiceRequest } from "@/features/practice/api";
import { CHAT_ERROR_CODES, CHAT_INVALID_RESPONSE_CODE, CHAT_PATHS } from "./constants";
import type { ChatHistoryTurn, ChatQuota, ChatReply } from "./contracts";
import { normalizeChatQuota, normalizeChatReply } from "./contracts";

export interface SendChatMessageInput {
  message: string;
  taskType: string | null;
  language: "en" | "vi";
  /** Text of the exercise on screen, sent as context; left out when there is none. */
  exercisePrompt?: string;
  /** Earlier turns of this conversation, kept in the browser; left out for the first question. */
  history?: ChatHistoryTurn[];
}

export interface ChatApi {
  sendMessage(input: SendChatMessageInput): Promise<ChatReply>;
  getQuota(): Promise<ChatQuota>;
}

function invalidResponse(): PracticeApiError {
  return new PracticeApiError("The chat service returned an unexpected response.", 502, CHAT_INVALID_RESPONSE_CODE);
}

const HTTP_SERVICE_UNAVAILABLE = 503;

/** The quota endpoint answers even while the admin has the AI chat off, so the switch is read beside it. */
async function chatSwitchedOn(request: typeof practiceRequest): Promise<boolean> {
  try {
    const capabilities = await request<{ chat?: unknown } | null>(CHAT_PATHS.aiCapabilities);
    return capabilities?.chat !== false;
  } catch {
    // An unreadable switch must not hide a working chat; sending still meets the server's own check.
    return true;
  }
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
      const [quota, switchedOn] = await Promise.all([request<unknown>(CHAT_PATHS.quota), chatSwitchedOn(request)]);
      if (!switchedOn) {
        throw new PracticeApiError("The AI chat is switched off.", HTTP_SERVICE_UNAVAILABLE, CHAT_ERROR_CODES.disabled);
      }
      return required(normalizeChatQuota(quota));
    },
  };
}
