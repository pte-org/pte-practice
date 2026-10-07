import type { IconName } from "../../common/components";

const DEFAULT_TASK_ICON: IconName = "practice";

/**
 * Maps server catalog sections to their shared skill icon.
 * Unknown sections intentionally use the neutral book icon until a new skill is added.
 */
export function iconForSection(section: string): IconName {
  switch (section.toUpperCase()) {
    case "SPEAKING":
      return "mic";
    case "WRITING":
      return "writing";
    case "READING":
      return "reading";
    case "LISTENING":
      return "listening";
    default:
      return "bookOpen";
  }
}

/**
 * Maps known PTE task codes to semantic icons.
 *
 * The API contract accepts future/custom task codes, so an unknown code uses a
 * neutral practice icon instead of rendering a broken or misleading glyph.
 */
export function iconForTaskType(taskType: string): IconName {
  switch (taskType.toUpperCase()) {
    case "PERSONAL_INTRODUCTION":
      return "personalIntroduction";
    case "READ_ALOUD":
      return "readAloud";
    case "REPEAT_SENTENCE":
      return "repeatSentence";
    case "DESCRIBE_IMAGE":
      return "describeImage";
    case "RE_TELL_LECTURE":
      return "reTellLecture";
    case "ANSWER_SHORT_QUESTION":
      return "shortQuestion";
    case "RESPOND_TO_A_SITUATION":
      return "respondSituation";
    case "SUMMARIZE_GROUP_DISCUSSION":
      return "groupDiscussion";
    case "SUMMARIZE_WRITTEN_TEXT":
      return "summarizeWritten";
    case "WRITE_EMAIL":
      return "writeEmail";
    case "WRITE_ESSAY":
      return "writeEssay";
    case "MC_READING_SINGLE":
    case "MC_LISTENING_SINGLE":
      return "multipleChoiceSingle";
    case "MC_READING_MULTIPLE":
    case "MC_LISTENING_MULTIPLE":
      return "multipleChoiceMultiple";
    case "RE_ORDER_PARAGRAPHS":
      return "reorderParagraphs";
    case "FILL_IN_THE_BLANKS_DRAG_AND_DROP":
      return "dragDrop";
    case "FILL_IN_THE_BLANKS_DROPDOWN":
      return "dropdown";
    case "SUMMARIZE_SPOKEN_TEXT":
      return "summarizeSpoken";
    case "FILL_IN_THE_BLANKS_TYPE_IN":
      return "fillTypeIn";
    case "HIGHLIGHT_CORRECT_SUMMARY":
      return "highlightSummary";
    case "SELECT_MISSING_WORD":
      return "missingWord";
    case "HIGHLIGHT_INCORRECT_WORDS":
      return "highlightIncorrect";
    case "WRITE_FROM_DICTATION":
      return "dictation";
    default:
      return DEFAULT_TASK_ICON;
  }
}
