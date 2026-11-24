import { describe, expect, it } from "vitest";
import { checksOnSelect, hasVerdicts, isChoiceRenderer, showsAnswerCheck } from "@/features/practice/session/instant-feedback";

const practice = { kind: "SKILL" };
const mockTest = { kind: "MOCK_TEST" };
const single = { rendererKey: "MC_READING_SINGLE_V1" };
const multiple = { rendererKey: "MC_LISTENING_MULTIPLE_V1" };
const blanks = { rendererKey: "FILL_IN_THE_BLANKS_DROPDOWN_V1" };

describe("instant answer check", () => {
  it("checks single- and multiple-choice answers of a practice session", () => {
    expect(showsAnswerCheck(practice, single)).toBe(true);
    expect(showsAnswerCheck({ kind: "TASK" }, multiple)).toBe(true);
    expect(showsAnswerCheck({ kind: null }, { rendererKey: "HIGHLIGHT_CORRECT_SUMMARY_V1" })).toBe(true);
    expect(showsAnswerCheck(practice, { rendererKey: "SELECT_MISSING_WORD_V1" })).toBe(true);
  });

  it("never checks inside a mock test, which is an exam rehearsal", () => {
    expect(showsAnswerCheck(mockTest, single)).toBe(false);
    expect(showsAnswerCheck(mockTest, multiple)).toBe(false);
  });

  it("checks a fill-in-the-blanks answer too, since it is scored against a key as well", () => {
    expect(showsAnswerCheck(practice, blanks)).toBe(true);
    expect(showsAnswerCheck(practice, { rendererKey: "FILL_IN_THE_BLANKS_DRAG_AND_DROP_V1" })).toBe(true);
    expect(showsAnswerCheck(mockTest, blanks)).toBe(false);
  });

  it("leaves AI-scored and the other multi-step answers on the plain flow", () => {
    for (const rendererKey of ["READ_ALOUD_V1", "SUMMARIZE_SPOKEN_TEXT_V1", "RE_ORDER_PARAGRAPHS_V1",
      "HIGHLIGHT_INCORRECT_WORDS_V1", "FILL_IN_THE_BLANKS_TYPE_IN_V1", null]) {
      expect(showsAnswerCheck(practice, { rendererKey }), String(rendererKey)).toBe(false);
    }
  });

  it("knows which renderers pick from a list of options", () => {
    expect(isChoiceRenderer("MC_READING_SINGLE_V1")).toBe(true);
    expect(isChoiceRenderer("FILL_IN_THE_BLANKS_DROPDOWN_V1")).toBe(false);
    expect(isChoiceRenderer(null)).toBe(false);
  });

  it("sends a single-choice answer on selection but waits for the button on a multiple-choice one", () => {
    expect(checksOnSelect(practice, single)).toBe(true);
    expect(checksOnSelect(practice, multiple)).toBe(false);
    expect(checksOnSelect(practice, blanks)).toBe(false);
    expect(checksOnSelect(mockTest, single)).toBe(false);
    expect(checksOnSelect(practice, { rendererKey: null })).toBe(false);
  });

  it("stays on a sent answer only when it came back with verdicts", () => {
    expect(hasVerdicts({ optionVerdicts: [{ orderIndex: 0 }] })).toBe(true);
    expect(hasVerdicts({ optionVerdicts: [] })).toBe(false);
    expect(hasVerdicts({})).toBe(false);
    expect(hasVerdicts(null)).toBe(false);
  });
});
