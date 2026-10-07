import { describe, expect, it } from "vitest";
import { PREVIEW_TASKS } from "./constants";
import { iconForSection, iconForTaskType } from "./icon-mapping";

const EXPECTED_TASK_ICONS: Record<string, string> = {
  PERSONAL_INTRODUCTION: "personalIntroduction",
  READ_ALOUD: "readAloud",
  REPEAT_SENTENCE: "repeatSentence",
  DESCRIBE_IMAGE: "describeImage",
  RE_TELL_LECTURE: "reTellLecture",
  ANSWER_SHORT_QUESTION: "shortQuestion",
  RESPOND_TO_A_SITUATION: "respondSituation",
  SUMMARIZE_GROUP_DISCUSSION: "groupDiscussion",
  SUMMARIZE_WRITTEN_TEXT: "summarizeWritten",
  WRITE_EMAIL: "writeEmail",
  WRITE_ESSAY: "writeEssay",
  MC_READING_SINGLE: "multipleChoiceSingle",
  MC_READING_MULTIPLE: "multipleChoiceMultiple",
  RE_ORDER_PARAGRAPHS: "reorderParagraphs",
  FILL_IN_THE_BLANKS_DRAG_AND_DROP: "dragDrop",
  FILL_IN_THE_BLANKS_DROPDOWN: "dropdown",
  SUMMARIZE_SPOKEN_TEXT: "summarizeSpoken",
  MC_LISTENING_SINGLE: "multipleChoiceSingle",
  MC_LISTENING_MULTIPLE: "multipleChoiceMultiple",
  FILL_IN_THE_BLANKS_TYPE_IN: "fillTypeIn",
  HIGHLIGHT_CORRECT_SUMMARY: "highlightSummary",
  SELECT_MISSING_WORD: "missingWord",
  HIGHLIGHT_INCORRECT_WORDS: "highlightIncorrect",
  WRITE_FROM_DICTATION: "dictation",
};

describe("iconForTaskType", () => {
  it("uses task-specific icons for the complete preview catalog", () => {
    const icons = PREVIEW_TASKS.map((task) => {
      expect(iconForTaskType(task.code)).toBe(EXPECTED_TASK_ICONS[task.code]);
      return iconForTaskType(task.code);
    });

    expect(icons).not.toContain("practice");
    expect(new Set(icons).size).toBeGreaterThanOrEqual(20);
  });

  it("matches the reference glyphs for the core speaking tasks", () => {
    expect(iconForTaskType("READ_ALOUD")).toBe("readAloud");
    expect(iconForTaskType("REPEAT_SENTENCE")).toBe("repeatSentence");
    expect(iconForTaskType("DESCRIBE_IMAGE")).toBe("describeImage");
    expect(iconForTaskType("RESPOND_TO_A_SITUATION")).toBe("respondSituation");
    expect(iconForTaskType("ANSWER_SHORT_QUESTION")).toBe("shortQuestion");
  });

  it("falls back safely for an unknown task code", () => {
    expect(iconForTaskType("UNKNOWN_TASK")).toBe("practice");
  });

  it("maps sections case-insensitively and uses a neutral fallback", () => {
    expect(iconForSection("speaking")).toBe("mic");
    expect(iconForSection("WRITING")).toBe("writing");
    expect(iconForSection("Reading")).toBe("reading");
    expect(iconForSection("listening")).toBe("listening");
    expect(iconForSection("UNKNOWN_SECTION")).toBe("bookOpen");
  });
});
