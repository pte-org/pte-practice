import { describe, expect, it } from "vitest";
import { orderCatalogSections, flattenCatalogTasks } from "@/features/practice/catalog-order";
import { PREVIEW_CATALOG } from "@/features/practice/preview-catalog";

describe("practice catalog presentation order", () => {
  it("keeps the complete fallback catalog visible", () => {
    const tasks = flattenCatalogTasks(PREVIEW_CATALOG.sections);

    expect(tasks).toHaveLength(22);
    expect(tasks.map((task) => task.code)).not.toContain("WRITE_EMAIL");
    expect(tasks.map((task) => task.code)).not.toContain("PERSONAL_INTRODUCTION");
  });

  it("uses the PTE section and task order", () => {
    const sections = orderCatalogSections(PREVIEW_CATALOG.sections);

    expect(sections.map((section) => section.code)).toEqual([
      "SPEAKING",
      "WRITING",
      "READING",
      "LISTENING",
    ]);
    expect(sections[0]?.taskTypes.map((task) => task.code)).toEqual([
      "READ_ALOUD",
      "REPEAT_SENTENCE",
      "DESCRIBE_IMAGE",
      "RE_TELL_LECTURE",
      "ANSWER_SHORT_QUESTION",
      "SUMMARIZE_GROUP_DISCUSSION",
      "RESPOND_TO_A_SITUATION",
    ]);
    expect(sections[1]?.taskTypes.map((task) => task.code)).toEqual([
      "SUMMARIZE_WRITTEN_TEXT",
      "WRITE_ESSAY",
      "SUMMARIZE_SPOKEN_TEXT",
      "WRITE_FROM_DICTATION",
    ]);
    expect(sections[2]?.taskTypes.map((task) => task.code)).toEqual([
      "FILL_IN_THE_BLANKS_DROPDOWN",
      "MC_READING_MULTIPLE",
      "RE_ORDER_PARAGRAPHS",
      "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
      "MC_READING_SINGLE",
      "HIGHLIGHT_CORRECT_SUMMARY",
      "HIGHLIGHT_INCORRECT_WORDS",
    ]);
    expect(sections[3]?.taskTypes.map((task) => task.code)).toEqual([
      "MC_LISTENING_MULTIPLE",
      "FILL_IN_THE_BLANKS_TYPE_IN",
      "MC_LISTENING_SINGLE",
      "SELECT_MISSING_WORD",
    ]);
  });
});
