import { describe, expect, it } from "vitest";
import { historyForRequest } from "@/features/chat/chat-history";
import type { ChatMessageView } from "@/features/chat/chat-state";
import { CHAT_HISTORY_MAX_TURNS } from "@/features/chat/constants";

function pair(index: number, refused = false): ChatMessageView[] {
  return [
    { id: `message-${index * 2}`, role: "user", text: `q${index}`, refused: false },
    { id: `message-${index * 2 + 1}`, role: "assistant", text: `a${index}`, refused },
  ];
}

describe("historyForRequest", () => {
  it("is empty for a new conversation", () => {
    expect(historyForRequest([])).toEqual([]);
  });

  it("turns each question and answer into a user turn and an assistant turn", () => {
    expect(historyForRequest([...pair(1), ...pair(2)])).toEqual([
      { role: "user", text: "q1" },
      { role: "assistant", text: "a1" },
      { role: "user", text: "q2" },
      { role: "assistant", text: "a2" },
    ]);
  });

  it("leaves out an exchange the assistant refused as off-topic", () => {
    expect(historyForRequest([...pair(1), ...pair(2, true), ...pair(3)]).map((turn) => turn.text)).toEqual([
      "q1",
      "a1",
      "q3",
      "a3",
    ]);
  });

  it("keeps only the newest turns, always whole pairs", () => {
    const messages = Array.from({ length: 10 }, (_, index) => pair(index + 1)).flat();
    const turns = historyForRequest(messages);

    expect(turns).toHaveLength(CHAT_HISTORY_MAX_TURNS);
    expect(turns[0]).toEqual({ role: "user", text: "q5" });
    expect(turns[turns.length - 1]).toEqual({ role: "assistant", text: "a10" });
  });

  it("does not change the messages it reads", () => {
    const messages = [...pair(1)];
    historyForRequest(messages);

    expect(messages).toHaveLength(2);
  });
});
