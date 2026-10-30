import { PracticeApiError, practiceRequest } from "@/features/practice/api";
import { CHAT_CONSENT_PATH, CHAT_HISTORY_PATH, CHAT_INVALID_RESPONSE_CODE, CHAT_PATHS } from "./constants";
import type { ChatConsent, ChatLatestSession, ChatQuota, ChatReply } from "./contracts";
import { normalizeChatConsent, normalizeChatQuota, normalizeChatReply, normalizeLatestSession } from "./contracts";

export interface SendChatMessageInput {
  sessionId: string;
  message: string;
  taskType: string | null;
  language: "en" | "vi";
  /** Text of the exercise on screen, sent as context; left out when there is none. */
  exercisePrompt?: string;
}

export interface ChatApi {
  sendMessage(input: SendChatMessageInput): Promise<ChatReply>;
  getQuota(): Promise<ChatQuota>;
  getLatestSession(): Promise<ChatLatestSession>;
  getConsent(): Promise<ChatConsent>;
  /** Records that the student accepted `policyVersion` and confirmed the age or guardian condition. */
  acceptConsent(policyVersion: string): Promise<ChatConsent>;
  /** Takes the consent back; chat closes until the student accepts the notice again. */
  withdrawConsent(): Promise<ChatConsent>;
  /** Erases the student's chat text for good; the daily question count is not given back. */
  deleteHistory(): Promise<void>;
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
    async getConsent() {
      return required(normalizeChatConsent(await request<unknown>(CHAT_CONSENT_PATH)));
    },
    async withdrawConsent() {
      return required(normalizeChatConsent(await request<unknown>(CHAT_CONSENT_PATH, { method: "DELETE" })));
    },
    async deleteHistory() {
      await request<unknown>(CHAT_HISTORY_PATH, { method: "DELETE" });
    },
    async acceptConsent(policyVersion) {
      return required(normalizeChatConsent(await request<unknown>(CHAT_CONSENT_PATH, {
        method: "POST",
        body: { policyVersion, ageConfirmed: true },
      })));
    },
  };
}
