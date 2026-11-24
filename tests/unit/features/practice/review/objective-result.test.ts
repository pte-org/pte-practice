import { describe, expect, it } from "vitest";
import { isObjectiveTask, objectiveOutcome, tallyVerdicts } from "@/features/practice/review/objective-result";

const mixed = [
  { orderIndex: 0, selected: true, correct: true },
  { orderIndex: 1, selected: true, correct: false },
  { orderIndex: 2, selected: false, correct: true },
  { orderIndex: 3, selected: false, correct: false },
];

describe("objective tasks", () => {
  it("knows the task types scored against a fixed key and not the AI ones", () => {
    for (const code of ["MC_READING_MULTIPLE", "HIGHLIGHT_CORRECT_SUMMARY", "RE_ORDER_PARAGRAPHS",
      "FILL_IN_THE_BLANKS_TYPE_IN", "WRITE_FROM_DICTATION"]) expect(isObjectiveTask(code), code).toBe(true);
    for (const code of ["READ_ALOUD", "SUMMARIZE_WRITTEN_TEXT", "WRITE_ESSAY", "SUMMARIZE_SPOKEN_TEXT",
      "DESCRIBE_IMAGE", "UNKNOWN"]) expect(isObjectiveTask(code), code).toBe(false);
  });
});

describe("objective result figures", () => {
  it("adds up right picks, wrong picks and right options left out", () => {
    expect(tallyVerdicts(mixed)).toEqual({ right: 1, wrong: 1, missed: 1 });
    expect(tallyVerdicts([])).toEqual({ right: 0, wrong: 0, missed: 0 });
  });

  it("names the outcome from the options when they are known, even when the score is 0", () => {
    expect(objectiveOutcome(0, mixed)).toBe("partial");
  });

  it("falls back to the score alone for answers without options", () => {
    expect(objectiveOutcome(100, [])).toBe("correct");
    expect(objectiveOutcome(0, [])).toBe("incorrect");
    expect(objectiveOutcome(40, [])).toBe("partial");
  });
});
