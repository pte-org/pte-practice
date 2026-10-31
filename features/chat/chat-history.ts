import type { ChatMessageView } from "./chat-state";
import { CHAT_HISTORY_MAX_TURNS } from "./constants";
import type { ChatHistoryTurn } from "./contracts";

/**
 * The earlier turns to send with the next question. Messages come in question/answer pairs; a pair whose answer
 * was refused as off-topic adds nothing to the next answer, so it is left out. Only the newest turns are kept,
 * always whole pairs, so the server sees an alternating conversation that starts with the student.
 */
export function historyForRequest(messages: ChatMessageView[]): ChatHistoryTurn[] {
  const turns: ChatHistoryTurn[] = [];
  for (let index = 0; index + 1 < messages.length; index += 2) {
    const question = messages[index];
    const answer = messages[index + 1];
    if (answer.refused) continue;
    turns.push({ role: "user", text: question.text }, { role: "assistant", text: answer.text });
  }
  return turns.slice(-CHAT_HISTORY_MAX_TURNS);
}
