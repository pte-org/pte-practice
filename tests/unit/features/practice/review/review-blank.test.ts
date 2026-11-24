import { describe, expect, it } from "vitest";
import { normalizeReview } from "@/features/practice/review-contracts";
import { reviewBlankRows } from "@/features/practice/review/review-blank";
import { reviewChoiceView } from "@/features/practice/review/review-choice";

const verdicts = [
  { orderIndex: 0, selected: true, correct: true, blankIndex: 0, text: "popular" },
  { orderIndex: 1, selected: false, correct: false, blankIndex: 0, text: "empty" },
  { orderIndex: 2, selected: false, correct: true, blankIndex: 1, text: "easy" },
  { orderIndex: 3, selected: true, correct: false, blankIndex: 1, text: "hard" },
];

const item = (optionVerdicts: unknown, rendererKey = "FILL_IN_THE_BLANKS_DROPDOWN_V1",
  savedPayload = "{\"selections\":{\"0\":\"popular\",\"1\":\"hard\"}}") => normalizeReview({
  items: [{ publicId: "item-1", taskCode: "FILL_IN_THE_BLANKS_DROPDOWN", status: "ANSWERED", orderIndex: 0,
    rendererKey, savedPayload, objectiveScore: 50,
    options: [{ text: "popular", orderIndex: 0 }, { text: "empty", orderIndex: 1 }],
    result: { itemPublicId: "item-1", taskCode: "FILL_IN_THE_BLANKS_DROPDOWN", state: "SCORED", score: 50,
      scoreStatus: null, subScores: {}, feedback: null, transcript: null, failureCode: null, retryable: false,
      scoredAt: null, optionVerdicts } }],
}, "session-1").items[0];

describe("review of a fill-in-the-blanks answer", () => {
  it("lists every gap in order with its word and the word that belonged there", () => {
    expect(reviewBlankRows(item(verdicts))).toEqual([
      { gap: 0, chosenWord: "popular", correctWord: "popular", state: "right" },
      { gap: 1, chosenWord: "hard", correctWord: "easy", state: "wrong" },
    ]);
  });

  it("shows a gap the student left with no word of its own", () => {
    // A gap left empty picks none of its words, which is how the server marks it.
    const empty = verdicts.map((verdict) => verdict.blankIndex === 1 ? { ...verdict, selected: false } : verdict);
    const rows = reviewBlankRows(item(empty, "FILL_IN_THE_BLANKS_DROPDOWN_V1", "{\"selections\":{\"0\":\"popular\"}}"));
    expect(rows?.[1]).toEqual({ gap: 1, chosenWord: "", correctWord: "easy", state: "empty" });
  });

  it("reads a drag-and-drop answer from its own field", () => {
    const rows = reviewBlankRows(item(verdicts, "FILL_IN_THE_BLANKS_DRAG_AND_DROP_V1",
      "{\"placements\":{\"0\":\"popular\",\"1\":\"hard\"}}"));
    expect(rows?.map((row) => row.chosenWord)).toEqual(["popular", "hard"]);
  });

  it("is not used for an answer that is not blanks", () => {
    expect(reviewBlankRows(item([{ orderIndex: 0, selected: true, correct: true, text: "a" }]))).toBeNull();
    expect(reviewBlankRows(item(undefined))).toBeNull();
  });

  it("is never shown as a list of choice options", () => {
    expect(reviewChoiceView(item(verdicts))).toBeNull();
  });
});
