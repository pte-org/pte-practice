import type { SendChatMessageInput } from "./api";
import { CHAT_EXERCISE_MAX_CHARS } from "./constants";

/**
 * The text of the exercise on screen, ready to send as context with a question: trimmed, with runs of spaces and
 * blank lines collapsed, and cut at a word boundary to the length the server accepts. Null when there is nothing
 * to send (an audio-only task, or no text yet).
 */
export function exerciseContextFrom(text: string | null | undefined): string | null {
  const cleaned = (text ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return null;
  if (cleaned.length <= CHAT_EXERCISE_MAX_CHARS) return cleaned;
  const cut = cleaned.slice(0, CHAT_EXERCISE_MAX_CHARS);
  const lastSpace = cut.search(/\s\S*$/);
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

type SendInputParts = Omit<SendChatMessageInput, "exercisePrompt"> & { exercisePrompt?: string | null };

/** The request body: the exercise text is added only when there is one, so a question without it is unchanged. */
export function buildSendInput({ exercisePrompt, ...rest }: SendInputParts): SendChatMessageInput {
  return exercisePrompt ? { ...rest, exercisePrompt } : rest;
}
