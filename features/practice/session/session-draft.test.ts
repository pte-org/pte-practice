import { describe, expect, it } from "vitest";
import {
  currentTaskPosition, effectiveDraft, hasAnswer, parsePayload, progressFor, sessionErrorMessage,
} from "./session-draft";

const messages = { conflict: "changed", expired: "expired", fallback: "failed" };
const task = { publicId: "i-1", savedPayload: '{"selectedOption":"1"}', confidence: "HIGH" as const, orderIndex: 2 };

describe("parsePayload", () => {
  it("reads a JSON object and treats everything else as no answer", () => {
    expect(parsePayload('{"a":1}')).toEqual({ a: 1 });
    expect(parsePayload(null)).toEqual({});
    expect(parsePayload("not json")).toEqual({});
    expect(parsePayload("[1,2]")).toEqual({});
    expect(parsePayload('"text"')).toEqual({});
  });
});

describe("effectiveDraft", () => {
  it("uses the local draft only for the item it belongs to", () => {
    expect(effectiveDraft(task, "i-1", { selectedOption: "2" })).toEqual({ selectedOption: "2" });
    expect(effectiveDraft(task, "other", { selectedOption: "2" })).toEqual({ selectedOption: "1" });
    expect(effectiveDraft(task, null, {})).toEqual({ selectedOption: "1" });
  });
});

describe("hasAnswer", () => {
  it("is false for empty arrays, blank strings and empty objects", () => {
    expect(hasAnswer({})).toBe(false);
    expect(hasAnswer({ selectedOptions: [] })).toBe(false);
    expect(hasAnswer({ text: "   " })).toBe(false);
    expect(hasAnswer({ selections: {} })).toBe(false);
    expect(hasAnswer({ blanks: ["", " "] })).toBe(false);
  });

  it("is true once anything meaningful is entered", () => {
    expect(hasAnswer({ selectedOption: "a" })).toBe(true);
    expect(hasAnswer({ blanks: ["", "word"] })).toBe(true);
    expect(hasAnswer({ selections: { "0": "x" } })).toBe(true);
    expect(hasAnswer({ selectedWordIndexes: [3] })).toBe(true);
  });
});

describe("progress helpers", () => {
  it("shows a sliver before any item and full when completed", () => {
    expect(progressFor({ totalItemCount: 0, status: "OVERVIEW", currentTask: null })).toBe(4);
    expect(progressFor({ totalItemCount: 5, status: "COMPLETED", currentTask: null })).toBe(100);
  });

  it("follows the current item's position", () => {
    expect(progressFor({ totalItemCount: 10, status: "IN_PROGRESS", currentTask: { orderIndex: 5 } as never })).toBe(50);
    expect(currentTaskPosition({ totalItemCount: 10, currentTask: { orderIndex: 2 } as never })).toBe(3);
    expect(currentTaskPosition({ totalItemCount: 10, currentTask: null })).toBe(10);
  });
});

describe("sessionErrorMessage", () => {
  it("has dedicated wording for a stale version and for expiry", () => {
    expect(sessionErrorMessage({ status: 409 }, messages)).toBe("changed");
    expect(sessionErrorMessage({ code: "PRACTICE_STALE_SESSION_VERSION" }, messages)).toBe("changed");
    expect(sessionErrorMessage({ status: 410 }, messages)).toBe("expired");
  });

  it("uses the server message, then the fallback", () => {
    expect(sessionErrorMessage({ status: 422, message: "Not ready" }, messages)).toBe("Not ready");
    expect(sessionErrorMessage(undefined, messages)).toBe("failed");
  });
});
