import { describe, expect, it } from "vitest";
import { describeSavedAnswer } from "@/features/practice/review-answer";

const options = [
  { text: "Alpha", orderIndex: 0 },
  { text: "Beta", orderIndex: 1 },
  { text: "Gamma", orderIndex: 2 },
];

describe("describeSavedAnswer", () => {
  it("reports a missing payload as empty", () => {
    expect(describeSavedAnswer(null, null, [])).toEqual({ kind: "empty" });
  });

  it("describes a recorded answer by its length, never by the media id", () => {
    const payload = JSON.stringify({ mediaPublicId: "0facdef9-3dab-44c7-b42c-ecb6a76f1b8d", durationSeconds: 35 });
    expect(describeSavedAnswer(payload, null, [])).toEqual({ kind: "audio", seconds: 35 });
  });

  it("returns written answers as plain text", () => {
    expect(describeSavedAnswer('{"text":"My essay."}', null, [])).toEqual({ kind: "text", text: "My essay." });
  });

  it("resolves picked option ids to their text", () => {
    expect(describeSavedAnswer('{"selectedOption":"1"}', null, options))
      .toEqual({ kind: "entries", entries: [{ value: "Beta" }] });
    expect(describeSavedAnswer('{"selectedOptions":["0","2"]}', null, options))
      .toEqual({ kind: "entries", entries: [{ value: "Alpha" }, { value: "Gamma" }] });
  });

  it("numbers the paragraphs of a re-ordered answer", () => {
    expect(describeSavedAnswer('{"order":["2","0","1"]}', null, options)).toEqual({
      kind: "entries",
      entries: [{ label: "1", value: "Gamma" }, { label: "2", value: "Alpha" }, { label: "3", value: "Beta" }],
    });
  });

  it("pairs each blank with the word the student used", () => {
    expect(describeSavedAnswer('{"placements":{"1":"cat","2":"dog"}}', null, []).kind).toBe("entries");
    expect(describeSavedAnswer('{"selections":{"2":"dog"}}', null, []))
      .toEqual({ kind: "entries", entries: [{ label: "2", value: "dog" }] });
    expect(describeSavedAnswer('{"blanks":["cat",""]}', null, [])).toEqual({
      kind: "entries",
      entries: [{ label: "1", value: "cat" }, { label: "2", value: "" }],
    });
  });

  it("maps highlighted word positions back to the passage words", () => {
    expect(describeSavedAnswer('{"selectedWordIndexes":[1,3]}', "The quick brown fox", []))
      .toEqual({ kind: "entries", entries: [{ value: "quick" }, { value: "fox" }] });
  });

  it("falls back to the raw text for a payload it does not recognise", () => {
    expect(describeSavedAnswer("not json", null, [])).toEqual({ kind: "raw", text: "not json" });
    expect(describeSavedAnswer('{"other":1}', null, [])).toEqual({ kind: "raw", text: '{"other":1}' });
  });
});
