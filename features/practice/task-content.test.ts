import { describe, expect, it } from "vitest";
import { fixtureFromPracticeTask } from "./task-content";

describe("practice task content", () => {
  it("builds renderer data from the server question projection", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "MC_READING_SINGLE",
      content: {
        promptText: "Read the passage.",
        minWordCount: null,
        maxWordCount: null,
        options: [
          { text: "First", orderIndex: 1, blankIndex: null },
          { text: "Correct order", orderIndex: 0, blankIndex: null },
        ],
      },
    });

    expect(fixture).toMatchObject({
      taskCode: "MC_READING_SINGLE",
      prompt: "Read the passage.",
      options: [
        { id: "0", label: "Correct order" },
        { id: "1", label: "First" },
      ],
    });
  });

  it("does not create a fixture when the server has no question content", () => {
    expect(fixtureFromPracticeTask({ taskCode: "READ_ALOUD", content: null })).toBeNull();
  });
});
