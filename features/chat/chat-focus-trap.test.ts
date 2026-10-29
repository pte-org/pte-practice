import { describe, expect, it } from "vitest";
import { trapTarget } from "./chat-focus-trap";

describe("trapTarget", () => {
  it("leaves Tab alone in the middle of the panel", () => {
    expect(trapTarget({ activeIndex: 1, count: 4, shiftKey: false })).toBeNull();
    expect(trapTarget({ activeIndex: 2, count: 4, shiftKey: true })).toBeNull();
  });

  it("wraps from the last control to the first", () => {
    expect(trapTarget({ activeIndex: 3, count: 4, shiftKey: false })).toBe(0);
  });

  it("wraps from the first control back to the last on Shift+Tab", () => {
    expect(trapTarget({ activeIndex: 0, count: 4, shiftKey: true })).toBe(3);
  });

  it("pulls focus in when it is outside the panel", () => {
    expect(trapTarget({ activeIndex: -1, count: 4, shiftKey: false })).toBe(0);
    expect(trapTarget({ activeIndex: -1, count: 4, shiftKey: true })).toBe(3);
  });

  it("does nothing when the panel has no focusable control", () => {
    expect(trapTarget({ activeIndex: -1, count: 0, shiftKey: false })).toBeNull();
  });

  it("keeps a single control focused", () => {
    expect(trapTarget({ activeIndex: 0, count: 1, shiftKey: false })).toBe(0);
    expect(trapTarget({ activeIndex: 0, count: 1, shiftKey: true })).toBe(0);
  });
});
