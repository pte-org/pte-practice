import { describe, expect, it } from "vitest";
import { choiceMark, choiceOutcome } from "@/features/practice/renderers/choice-verdict";
import type { PracticeOptionVerdict } from "@/features/practice/result-contracts";

const verdicts: PracticeOptionVerdict[] = [
  { orderIndex: 0, selected: true, correct: true },
  { orderIndex: 1, selected: true, correct: false },
  { orderIndex: 2, selected: false, correct: true },
  { orderIndex: 3, selected: false, correct: false },
];

describe("choice verdict marks", () => {
  it("marks a picked right option right, a picked wrong one wrong, and a right one left out as missed", () => {
    expect(choiceMark("0", verdicts)).toBe("right");
    expect(choiceMark("1", verdicts)).toBe("wrong");
    expect(choiceMark("2", verdicts)).toBe("missed");
  });

  it("leaves an unpicked wrong option and an unknown option plain", () => {
    expect(choiceMark("3", verdicts)).toBe("none");
    expect(choiceMark("9", verdicts)).toBe("none");
    expect(choiceMark("0", [])).toBe("none");
  });
});

describe("choice verdict outcome", () => {
  it("is correct only when nothing is wrong or left out", () => {
    expect(choiceOutcome([{ orderIndex: 0, selected: true, correct: true },
      { orderIndex: 1, selected: false, correct: false }])).toBe("correct");
  });

  it("is incorrect when no pick is right, even if a right option was left out", () => {
    expect(choiceOutcome([{ orderIndex: 0, selected: true, correct: false },
      { orderIndex: 1, selected: false, correct: true }])).toBe("incorrect");
  });

  it("is partial when some picks are right but not all is", () => {
    expect(choiceOutcome(verdicts)).toBe("partial");
    expect(choiceOutcome([{ orderIndex: 0, selected: true, correct: true },
      { orderIndex: 1, selected: false, correct: true }])).toBe("partial");
  });

  it("has no outcome without verdicts", () => {
    expect(choiceOutcome([])).toBeNull();
  });
});
