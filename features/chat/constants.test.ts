import { describe, expect, it } from "vitest";
import { en } from "@/common/i18n";
import {
  CHAT_ERROR_CODES,
  CHAT_MAX_INPUT_CHARS,
  CHAT_PATHS,
  CHAT_TASK_TYPES,
  CHAT_WARNING_THRESHOLD,
} from "./constants";

const EXPECTED_TASK_TYPES = [
  "PERSONAL_INTRODUCTION",
  "READ_ALOUD",
  "REPEAT_SENTENCE",
  "DESCRIBE_IMAGE",
  "RE_TELL_LECTURE",
  "ANSWER_SHORT_QUESTION",
  "RESPOND_TO_A_SITUATION",
  "SUMMARIZE_GROUP_DISCUSSION",
  "SUMMARIZE_WRITTEN_TEXT",
  "WRITE_ESSAY",
  "MC_READING_SINGLE",
  "MC_READING_MULTIPLE",
  "RE_ORDER_PARAGRAPHS",
  "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
  "FILL_IN_THE_BLANKS_DROPDOWN",
  "SUMMARIZE_SPOKEN_TEXT",
  "MC_LISTENING_SINGLE",
  "MC_LISTENING_MULTIPLE",
  "FILL_IN_THE_BLANKS_TYPE_IN",
  "HIGHLIGHT_CORRECT_SUMMARY",
  "SELECT_MISSING_WORD",
  "HIGHLIGHT_INCORRECT_WORDS",
  "WRITE_FROM_DICTATION",
];

describe("chat constants", () => {
  it("points the endpoints at the student chat API", () => {
    expect(CHAT_PATHS).toEqual({
      messages: "/api/v1/student/chat/messages",
      quota: "/api/v1/student/chat/quota",
      latestSession: "/api/v1/student/chat/sessions/latest",
    });
  });

  it("limits a question to 1000 characters and warns at 3 remaining", () => {
    expect(CHAT_MAX_INPUT_CHARS).toBe(1000);
    expect(CHAT_WARNING_THRESHOLD).toBe(3);
  });

  it("lists the five backend chat error codes", () => {
    expect(CHAT_ERROR_CODES).toEqual({
      quotaExceeded: "CHAT_QUOTA_EXCEEDED",
      inFlight: "CHAT_REQUEST_IN_FLIGHT",
      busy: "CHAT_BUSY",
      sessionNotFound: "CHAT_SESSION_NOT_FOUND",
      invalidRequest: "CHAT_INVALID_REQUEST",
    });
  });

  it("whitelists exactly the 23 PTE task types", () => {
    expect(CHAT_TASK_TYPES).toHaveLength(23);
    expect(new Set(CHAT_TASK_TYPES).size).toBe(23);
    expect([...CHAT_TASK_TYPES].sort()).toEqual([...EXPECTED_TASK_TYPES].sort());
  });

  it("covers every task type the UI dictionary knows about", () => {
    const dictionaryTasks = Object.keys(en.tasks);
    for (const task of dictionaryTasks) expect(CHAT_TASK_TYPES).toContain(task);
  });
});
