import { CHAT_TASK_TYPES } from "./constants";

/** Returns the task type when it is one the server accepts, otherwise null (the chat still works without it). */
export function normalizeChatTaskType(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return CHAT_TASK_TYPES.includes(trimmed) ? trimmed : null;
}
