import { describe, expect, it } from "vitest";
import { normalizePracticeItemResult } from "@/features/practice/contracts";
import { normalizeReview } from "@/features/practice/review-contracts";
import { correctOptionLabels, reviewChoiceView } from "@/features/practice/review/review-choice";
import { historyFromReview } from "@/features/practice/session/session-history";

const scored = {
  itemPublicId: "item-1", taskCode: "MC_READING_MULTIPLE", state: "SCORED", score: 50, scoreStatus: null,
  subScores: {}, feedback: null, transcript: null, failureCode: null, retryable: false, scoredAt: null,
};
const verdicts = [
  { orderIndex: 0, selected: true, correct: true },
  { orderIndex: 1, selected: false, correct: true },
];

describe("option verdicts of a scored answer", () => {
  it("keeps well-formed verdicts and drops malformed entries", () => {
    const result = normalizePracticeItemResult({
      ...scored,
      optionVerdicts: [...verdicts, { orderIndex: "2", selected: true }, { selected: true, correct: true }, "x",
        { orderIndex: 3 }],
    });
    expect(result?.optionVerdicts).toEqual([...verdicts, { orderIndex: 3, selected: false, correct: false }]);
  });

  it("keeps the gap and the text of a fill-in-the-blanks verdict", () => {
    const result = normalizePracticeItemResult({ ...scored,
      optionVerdicts: [{ orderIndex: 0, selected: true, correct: true, blankIndex: 1, text: "easy" }] });
    expect(result?.optionVerdicts).toEqual([{ orderIndex: 0, selected: true, correct: true, blankIndex: 1, text: "easy" }]);
  });

  it("has no verdicts field when the server sent none or an empty list", () => {
    expect(normalizePracticeItemResult(scored)).not.toHaveProperty("optionVerdicts");
    expect(normalizePracticeItemResult({ ...scored, optionVerdicts: [] })).not.toHaveProperty("optionVerdicts");
  });
});

describe("history of a resumed session", () => {
  const review = (result: unknown) => normalizeReview({
    items: [{ publicId: "item-1", taskCode: "MC_READING_MULTIPLE", rendererKey: "MC_READING_MULTIPLE_V1",
      status: "ANSWERED", orderIndex: 0, savedPayload: "{\"selectedOptions\":[\"0\"]}", objectiveScore: 50, result }],
  }, "session-1");

  it("carries the right and wrong marks of a choice answer into the question you go back to", () => {
    const [item] = historyFromReview(review({ ...scored, optionVerdicts: verdicts }).items);
    expect(item.result?.optionVerdicts).toEqual(verdicts);
    expect(item.result?.score).toBe(50);
  });

  it("keeps the old result shape for an answer the review has no verdicts for", () => {
    const [item] = historyFromReview(review(scored).items);
    expect(item.result).not.toHaveProperty("optionVerdicts");
    expect(item.result?.score).toBe(50);
  });
});

describe("review of a choice answer", () => {
  const options = [
    { text: "third", orderIndex: 2, blankIndex: null }, { text: "first", orderIndex: 0, blankIndex: null },
    { text: "second", orderIndex: 1, blankIndex: null },
  ];
  const reviewed = (result: unknown, status = "ANSWERED") => normalizeReview({
    items: [{ publicId: "item-1", taskCode: "MC_READING_MULTIPLE", rendererKey: "MC_READING_MULTIPLE_V1", status, orderIndex: 0, options,
      savedPayload: "{\"selectedOptions\":[\"0\",\"2\"]}", result }],
  }, "session-1").items[0];

  it("lists every option in order with what was picked and which were right", () => {
    const view = reviewChoiceView(reviewed({ ...scored, optionVerdicts: verdicts }));
    expect(view?.options.map((option) => option.label)).toEqual(["first", "second", "third"]);
    expect(view?.options.map((option) => option.id)).toEqual(["0", "1", "2"]);
    expect(view?.selected).toEqual(["0", "2"]);
    expect(view?.multiple).toBe(true);
    expect(view?.verdicts).toEqual(verdicts);
  });

  it("lists the text of the right options as the answer key, in option order", () => {
    const view = reviewChoiceView(reviewed({ ...scored, optionVerdicts: [
      { orderIndex: 2, selected: true, correct: true }, { orderIndex: 0, selected: false, correct: true },
      { orderIndex: 1, selected: true, correct: false }] }));
    expect(view && correctOptionLabels(view)).toEqual(["first", "third"]);
  });

  it("shows the plain submitted answer when there is nothing to mark", () => {
    expect(reviewChoiceView(reviewed(scored))).toBeNull();
    expect(reviewChoiceView(reviewed(null, "SKIPPED"))).toBeNull();
  });
});
