import { describe, expect, it } from "vitest";
import { blankMarks, hasBlankVerdicts } from "@/features/practice/renderers/blank-verdict";

const verdicts = [
  { orderIndex: 0, selected: true, correct: true, blankIndex: 0, text: "popular" },
  { orderIndex: 1, selected: false, correct: false, blankIndex: 0, text: "empty" },
  { orderIndex: 2, selected: false, correct: true, blankIndex: 1, text: "easy" },
  { orderIndex: 3, selected: true, correct: false, blankIndex: 1, text: "hard" },
  { orderIndex: 4, selected: false, correct: true, blankIndex: 2, text: "quick" },
  { orderIndex: 5, selected: false, correct: false, blankIndex: 2, text: "slow" },
];

describe("blank verdicts", () => {
  it("tells a blanks answer from a choice one", () => {
    expect(hasBlankVerdicts(verdicts)).toBe(true);
    expect(hasBlankVerdicts([{ orderIndex: 0, selected: true, correct: true }])).toBe(false);
    expect(hasBlankVerdicts([])).toBe(false);
  });

  it("marks each gap by the word put in it and names the word that belonged there", () => {
    const marks = blankMarks(verdicts);
    expect(marks.get(0)).toEqual({ state: "right", correctWord: "popular" });
    expect(marks.get(1)).toEqual({ state: "wrong", correctWord: "easy" });
  });

  it("marks a gap the student left as empty, not wrong", () => {
    expect(blankMarks(verdicts).get(2)).toEqual({ state: "empty", correctWord: "quick" });
  });

  it("ignores options that belong to no gap", () => {
    expect(blankMarks([{ orderIndex: 0, selected: true, correct: true, text: "a" }]).size).toBe(0);
  });
});
