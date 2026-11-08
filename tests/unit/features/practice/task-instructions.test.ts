import { describe, expect, it } from "vitest";
import { getCanonicalTaskInstruction } from "@/features/practice/task-instructions";

describe("getCanonicalTaskInstruction", () => {
  it("does not claim a preparation countdown in ordinary speaking practice", () => {
    for (const code of ["READ_ALOUD", "DESCRIBE_IMAGE", "RE_TELL_LECTURE"]) {
      expect(getCanonicalTaskInstruction(code, null, true)).not.toContain("seconds");
      expect(getCanonicalTaskInstruction(code)).toContain("seconds");
    }
  });
  it("removes writing deadlines in untimed practice while preserving response requirements", () => {
    for (const code of ["WRITE_ESSAY", "SUMMARIZE_WRITTEN_TEXT", "SUMMARIZE_SPOKEN_TEXT"]) {
      expect(getCanonicalTaskInstruction(code, null, true)).not.toContain("minutes");
      expect(getCanonicalTaskInstruction(code)).toContain("minutes");
    }
    expect(getCanonicalTaskInstruction("WRITE_ESSAY", null, true)).toContain("200-300 words");
    expect(getCanonicalTaskInstruction("SUMMARIZE_WRITTEN_TEXT", null, true)).toContain("one sentence");
    expect(getCanonicalTaskInstruction("SUMMARIZE_SPOKEN_TEXT", null, true)).toContain("50-70 words");
  });
  it("returns null for empty or null task code", () => {
    expect(getCanonicalTaskInstruction(null)).toBeNull();
    expect(getCanonicalTaskInstruction("")).toBeNull();
  });

  it("returns formatted instruction for READ_ALOUD with custom response seconds", () => {
    const text = getCanonicalTaskInstruction("READ_ALOUD", {
      preListenSeconds: null,
      preRecordSeconds: 35,
      responseSeconds: 40,
    });
    expect(text).toBe(
      "Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.",
    );
  });

  it("returns standard instruction for REPEAT_SENTENCE", () => {
    const text = getCanonicalTaskInstruction("REPEAT_SENTENCE");
    expect(text).toBe(
      "You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.",
    );
  });

  it("returns instruction for DESCRIBE_IMAGE with prep and response seconds", () => {
    const text = getCanonicalTaskInstruction("DESCRIBE_IMAGE", {
      preListenSeconds: null,
      preRecordSeconds: 25,
      responseSeconds: 40,
    });
    expect(text).toBe(
      "Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing. You have 40 seconds to give your response.",
    );
  });

  it("returns instruction for reading and writing fill in the blanks", () => {
    expect(getCanonicalTaskInstruction("FILL_IN_THE_BLANKS_DROPDOWN")).toContain("Below is a text with blanks.");
    expect(getCanonicalTaskInstruction("FILL_IN_THE_BLANKS_DRAG_AND_DROP")).toContain("In the text below some words are missing.");
  });

  it("returns null for unknown task code", () => {
    expect(getCanonicalTaskInstruction("UNKNOWN_TASK")).toBeNull();
  });
});
