import { describe, expect, it } from "vitest";
import { getCanonicalTaskInstruction } from "./task-instructions";

describe("getCanonicalTaskInstruction", () => {
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
