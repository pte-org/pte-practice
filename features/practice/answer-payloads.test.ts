import { describe, expect, it } from "vitest";
import {
  setBlankWord,
  setTypeInBlank,
  toggleChoice,
  toggleWordIndex,
  typeInBlankValues,
  wordIndexes,
} from "./answer-payloads";

describe("single and multiple choice payloads", () => {
  it("sends the order index of the picked option as selectedOption", () => {
    expect(toggleChoice({}, "2", false)).toEqual({ selectedOption: "2" });
    expect(toggleChoice({ selectedOption: "2" }, "0", false)).toEqual({ selectedOption: "0" });
  });

  it("toggles ids inside selectedOptions for multiple choice", () => {
    const first = toggleChoice({}, "1", true);
    const second = toggleChoice(first, "3", true);
    expect(second).toEqual({ selectedOptions: ["1", "3"] });
    expect(toggleChoice(second, "1", true)).toEqual({ selectedOptions: ["3"] });
  });
});

describe("highlight incorrect words payload", () => {
  it("uses integer word indexes in ascending order", () => {
    const first = toggleWordIndex({}, 5);
    const second = toggleWordIndex(first, 1);
    expect(second).toEqual({ selectedWordIndexes: [1, 5] });
    expect(toggleWordIndex(second, 5)).toEqual({ selectedWordIndexes: [1] });
  });

  it("reads only valid non-negative integers back", () => {
    expect(wordIndexes({ selectedWordIndexes: [2, -1, 1.5, "3", 4] })).toEqual([2, 4]);
    expect(wordIndexes({})).toEqual([]);
  });
});

describe("fill in the blanks payloads", () => {
  it("drag and drop writes placements keyed by gap number", () => {
    const value = setBlankWord({}, "placements", 0, "reduce");
    expect(setBlankWord(value, "placements", 2, "efficient")).toEqual({
      placements: { "0": "reduce", "2": "efficient" },
    });
  });

  it("dropdown writes selections keyed by gap number", () => {
    expect(setBlankWord({ selections: { "0": "a" } }, "selections", 1, "b")).toEqual({
      selections: { "0": "a", "1": "b" },
    });
  });

  it("clearing a blank removes its key", () => {
    expect(setBlankWord({ placements: { "0": "a", "1": "b" } }, "placements", 0, "")).toEqual({
      placements: { "1": "b" },
    });
  });

  it("type-in keeps a positional array with empty strings for untouched blanks", () => {
    const first = setTypeInBlank({}, 1, "planet", 3);
    expect(first).toEqual({ blanks: ["", "planet", ""] });
    expect(setTypeInBlank(first, 0, "the", 3)).toEqual({ blanks: ["the", "planet", ""] });
    expect(typeInBlankValues({ blanks: ["a", 5, "c"] }, 4)).toEqual(["a", "", "c", ""]);
  });

  it("type-in rejects commas and caps a blank at 128 characters", () => {
    expect(setTypeInBlank({}, 0, "a,b", 1)).toEqual({ blanks: ["ab"] });
    expect(setTypeInBlank({}, 0, "x".repeat(200), 1)).toEqual({ blanks: ["x".repeat(128)] });
  });
});
