import { describe, expect, it } from "vitest";
import { scrollTargetFor } from "./chat-scroll";
import type { ChatMessageView } from "./chat-state";

const user = (id: string): ChatMessageView => ({ id, role: "user", text: "q", refused: false });
const assistant = (id: string, refused = false): ChatMessageView => ({ id, role: "assistant", text: "a", refused });

describe("scrollTargetFor", () => {
  it("scrolls to the end while a question is waiting, so the typing indicator is visible", () => {
    expect(scrollTargetFor({ previousCount: 0, messages: [], pendingQuestion: "hi" })).toBe("end");
  });

  it("scrolls to the start of a new answer so a long answer is read from its first line", () => {
    const messages = [user("m0"), assistant("m1")];
    expect(scrollTargetFor({ previousCount: 0, messages, pendingQuestion: null })).toBe("start-of-last-answer");
  });

  it("also starts at a refusal, which is a short assistant bubble", () => {
    const messages = [user("m0"), assistant("m1"), user("m2"), assistant("m3", true)];
    expect(scrollTargetFor({ previousCount: 2, messages, pendingQuestion: null })).toBe("start-of-last-answer");
  });

  it("scrolls to the end when a stored conversation of several exchanges loads", () => {
    const messages = [user("m0"), assistant("m1"), user("m2"), assistant("m3")];
    expect(scrollTargetFor({ previousCount: 0, messages, pendingQuestion: null })).toBe("end");
  });

  it("does nothing when nothing was added", () => {
    const messages = [user("m0"), assistant("m1")];
    expect(scrollTargetFor({ previousCount: 2, messages, pendingQuestion: null })).toBe("none");
  });

  it("does nothing for an empty list", () => {
    expect(scrollTargetFor({ previousCount: 0, messages: [], pendingQuestion: null })).toBe("none");
  });

  it("does nothing after a new chat shrinks the list to nothing", () => {
    expect(scrollTargetFor({ previousCount: 4, messages: [], pendingQuestion: null })).toBe("none");
  });
});
