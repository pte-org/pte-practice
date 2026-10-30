import { describe, expect, it } from "vitest";
import { isChatEnabled } from "@/features/chat/chat-flag";

describe("isChatEnabled", () => {
  it("is on only for the string true, ignoring case and surrounding spaces", () => {
    expect(isChatEnabled("true")).toBe(true);
    expect(isChatEnabled("TRUE")).toBe(true);
    expect(isChatEnabled("  True ")).toBe(true);
  });

  it("is off when unset or anything else", () => {
    expect(isChatEnabled(undefined)).toBe(false);
    expect(isChatEnabled("")).toBe(false);
    expect(isChatEnabled("false")).toBe(false);
    expect(isChatEnabled("1")).toBe(false);
    expect(isChatEnabled("yes")).toBe(false);
    expect(isChatEnabled("truee")).toBe(false);
  });
});
