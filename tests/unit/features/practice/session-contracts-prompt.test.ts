import { describe, expect, it } from "vitest";
import { normalizePracticeItemResult } from "@/features/practice/session-contracts";

describe("item result transcript release", () => {
  it("keeps the prompt transcript the server releases after the answer", () => {
    const result = normalizePracticeItemResult({ itemPublicId: "i1", taskCode: "REPEAT_SENTENCE", state: "SCORING", promptText: "Spoken sentence." });
    expect(result?.promptText).toBe("Spoken sentence.");
  });
});
