import { describe, expect, it } from "vitest";
import { countPracticeWords, normalizePracticeText } from "./text-utils";

describe("practice text utilities", () => {
  it("counts Unicode words without counting punctuation", () => {
    expect(countPracticeWords("Café learners — practise every day.")).toBe(5);
  });

  it("normalizes pasted text to NFC without trimming the draft", () => {
    expect(normalizePracticeText("e\u0301  draft ")).toBe("é  draft ");
  });
});
