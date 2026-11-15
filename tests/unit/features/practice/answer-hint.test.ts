import { describe, expect, it } from "vitest";
import { answerHintLines } from "@/features/practice/answer-hint";

describe("answerHintLines", () => {
  it("is empty when the question has no hint", () => {
    expect(answerHintLines(null, "vi")).toEqual([]);
    expect(answerHintLines({ answerHintVi: " ", answerHintEn: null }, "en")).toEqual([]);
  });

  it("uses the interface language and splits bullet lines", () => {
    const content = { answerHintVi: "- Nghe ý chính\n- Ghi từ khóa", answerHintEn: "Listen for the gist" };
    expect(answerHintLines(content, "vi")).toEqual(["Nghe ý chính", "Ghi từ khóa"]);
    expect(answerHintLines(content, "en")).toEqual(["Listen for the gist"]);
  });

  it("falls back to the other language when one is missing", () => {
    expect(answerHintLines({ answerHintVi: null, answerHintEn: "Plan an outline" }, "vi")).toEqual(["Plan an outline"]);
  });
});
