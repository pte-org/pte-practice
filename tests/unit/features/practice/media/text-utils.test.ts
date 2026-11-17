import { describe, expect, it } from "vitest";
import { countPracticeWords, normalizePracticeText } from "@/features/practice/media/text-utils";

describe("practice text utilities", () => {
  it("counts Unicode words the way the scorer does, by whitespace", () => {
    expect(countPracticeWords("Café learners practise every day.")).toBe(5);
    // A free-standing dash is one token for the scorer too, so it counts here as well.
    expect(countPracticeWords("Café learners — practise every day.")).toBe(6);
  });

  it("counts a hyphenated word as one word, like the server", () => {
    expect(countPracticeWords("A well-known decision-making twenty-five")).toBe(4);
  });

  it("treats blank text and runs of whitespace or line breaks sensibly", () => {
    expect(countPracticeWords("")).toBe(0);
    expect(countPracticeWords("  \n\t ")).toBe(0);
    expect(countPracticeWords("one   two\n\nthree\tfour")).toBe(4);
  });

  it("normalizes pasted text to NFC without trimming the draft", () => {
    expect(normalizePracticeText("é  draft ")).toBe("é  draft ");
  });
});
