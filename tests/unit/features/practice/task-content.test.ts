import { describe, expect, it } from "vitest";
import type { PracticeTaskContent } from "@/features/practice/contracts";
import { fixtureFromPracticeTask } from "@/features/practice/task-content";

function content(overrides: Partial<PracticeTaskContent> = {}): PracticeTaskContent {
  return {
    promptText: null,
    minWordCount: null,
    maxWordCount: null,
    audioPromptRef: null,
    imagePromptRef: null,
    audioUrl: null,
    imageUrl: null,
    options: [],
    ...overrides,
  };
}

describe("practice task content", () => {
  it("builds renderer data from the server question projection", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "MC_READING_SINGLE",
      content: content({
        promptText: "Read the passage.",
        options: [
          { text: "First", orderIndex: 1, blankIndex: null },
          { text: "Correct order", orderIndex: 0, blankIndex: null },
        ],
      }),
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

  it("keeps an audio-only prompt such as Repeat Sentence", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "REPEAT_SENTENCE",
      content: content({ audioPromptRef: "audio-1", audioUrl: "https://cdn.test/a.mp3" }),
    });
    expect(fixture).toMatchObject({ taskCode: "REPEAT_SENTENCE", audioUrl: "https://cdn.test/a.mp3", audioExpected: true });
  });

  it("flags prompt media whose link could not be presigned", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "DESCRIBE_IMAGE",
      content: content({ imagePromptRef: "image-1" }),
    });
    expect(fixture).toMatchObject({ imageExpected: true, imageUrl: null });
  });

  it("carries the prompt image of Describe Image", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "DESCRIBE_IMAGE",
      content: content({ imagePromptRef: "image-1", imageUrl: "https://cdn.test/i.png" }),
    });
    expect(fixture?.imageUrl).toBe("https://cdn.test/i.png");
  });

  it("uses the order index as the paragraph id for Re-order Paragraphs", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "RE_ORDER_PARAGRAPHS",
      content: content({
        promptText: "Re-order.",
        options: [
          { text: "B", orderIndex: 1, blankIndex: null },
          { text: "A", orderIndex: 0, blankIndex: null },
        ],
      }),
    });
    expect(fixture?.paragraphs).toEqual([{ id: "0", text: "A" }, { id: "1", text: "B" }]);
  });

  it("keeps the {{n}} markers and a shared word bank for drag and drop", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
      content: content({
        promptText: "Good {{0}} can {{1}} risk.",
        options: [
          { text: "planning", orderIndex: 0, blankIndex: null },
          { text: "reduce", orderIndex: 1, blankIndex: null },
        ],
      }),
    });
    expect(fixture?.text).toBe("Good {{0}} can {{1}} risk.");
    expect(fixture?.blankOptions).toEqual(["planning", "reduce"]);
  });

  it("groups dropdown options by blank index", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "FILL_IN_THE_BLANKS_DROPDOWN",
      content: content({
        promptText: "It is {{0}} and {{1}}.",
        options: [
          { text: "reliable", orderIndex: 0, blankIndex: 0 },
          { text: "rare", orderIndex: 1, blankIndex: 0 },
          { text: "easy", orderIndex: 2, blankIndex: 1 },
          { text: "complex", orderIndex: 3, blankIndex: 1 },
        ],
      }),
    });
    expect(fixture?.blankOptionsByIndex).toEqual({ "0": ["reliable", "rare"], "1": ["easy", "complex"] });
  });

  it("splits Highlight Incorrect Words into whitespace tokens keyed by word index", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "HIGHLIGHT_INCORRECT_WORDS",
      content: content({ promptText: "The team recorded results,  weekly." }),
    });
    expect(fixture?.tokens).toEqual([
      { id: "0", text: "The" },
      { id: "1", text: "team" },
      { id: "2", text: "recorded" },
      { id: "3", text: "results," },
      { id: "4", text: "weekly." },
    ]);
  });

  it("counts the {{n}} gaps of a type-in passage", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "FILL_IN_THE_BLANKS_TYPE_IN",
      content: content({ promptText: "The {{0}} explains {{1}} memory {{2}}.", audioPromptRef: "a", audioUrl: "u" }),
    });
    expect(fixture?.text).toBe("The {{0}} explains {{1}} memory {{2}}.");
  });

  it("passes word limits through for the text tasks", () => {
    const fixture = fixtureFromPracticeTask({
      taskCode: "SUMMARIZE_WRITTEN_TEXT",
      content: content({ promptText: "Passage.", minWordCount: 5, maxWordCount: 75 }),
    });
    expect(fixture).toMatchObject({ minWords: 5, maxWords: 75 });
  });
});
