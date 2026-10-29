import type { ChatMessageView } from "./chat-state";

export type ChatScrollTarget = "end" | "start-of-last-answer" | "none";

/** One question and its answer: the size of the change when a reply arrives. */
const MESSAGES_PER_EXCHANGE = 2;

/**
 * Where the message list should scroll after it changes. A waiting question and a loaded conversation
 * go to the end; a freshly arrived answer goes to its own first line, so a long answer is read from the top.
 */
export function scrollTargetFor(input: {
  previousCount: number;
  messages: ChatMessageView[];
  pendingQuestion: string | null;
}): ChatScrollTarget {
  if (input.pendingQuestion !== null) return "end";
  const added = input.messages.length - input.previousCount;
  if (added <= 0) return "none";
  const last = input.messages[input.messages.length - 1];
  return added === MESSAGES_PER_EXCHANGE && last.role === "assistant" ? "start-of-last-answer" : "end";
}
