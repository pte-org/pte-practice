import { CHAT_MAX_INPUT_CHARS } from "./constants";

export type ChatInputResult =
  | { ok: true; text: string }
  | { ok: false; reason: "empty" | "too_long" };

export function validateChatInput(text: string): ChatInputResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.length > CHAT_MAX_INPUT_CHARS) return { ok: false, reason: "too_long" };
  return { ok: true, text: trimmed };
}

/** Characters left before the limit; negative once the draft is too long. */
export function remainingInputChars(text: string): number {
  return CHAT_MAX_INPUT_CHARS - text.length;
}
