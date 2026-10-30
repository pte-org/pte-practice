import { describe, expect, it } from "vitest";
import { parseBlankPrompt } from "@/features/practice/blank-prompt";

describe("blank prompt parser", () => {
  it("splits the passage on {{n}} gap markers in source order", () => {
    expect(parseBlankPrompt("Good {{0}} can {{1}} risk.")).toEqual([
      { kind: "text", text: "Good " },
      { kind: "gap", index: 0 },
      { kind: "text", text: " can " },
      { kind: "gap", index: 1 },
      { kind: "text", text: " risk." },
    ]);
  });

  it("keeps the original gap numbers even when they are not contiguous", () => {
    const gaps = parseBlankPrompt("A {{3}} b {{1}}").filter((segment) => segment.kind === "gap");
    expect(gaps).toEqual([{ kind: "gap", index: 3 }, { kind: "gap", index: 1 }]);
  });

  it("treats a prompt without markers as one text segment", () => {
    expect(parseBlankPrompt("No gaps here")).toEqual([{ kind: "text", text: "No gaps here" }]);
  });

  it("leaves malformed markers as literal text", () => {
    expect(parseBlankPrompt("x {{a}} y {1}")).toEqual([{ kind: "text", text: "x {{a}} y {1}" }]);
  });
});
