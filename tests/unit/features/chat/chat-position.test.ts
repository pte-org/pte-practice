import { describe, expect, it } from "vitest";
import { clampChatPosition, resizeChatBounds } from "@/features/chat/chat-position";

describe("chat panel viewport bounds", () => {
  const panel = { width: 400, height: 560 };
  const screen = { width: 1440, height: 900 };

  it("preserves positions inside the screen", () => {
    expect(clampChatPosition({ left: 250, top: 100 }, panel, screen)).toEqual({ left: 250, top: 100 });
  });
  it("keeps the header reachable at the top and left edges", () => {
    expect(clampChatPosition({ left: -500, top: -100 }, panel, screen)).toEqual({ left: 12, top: 12 });
  });
  it("keeps the entire panel inside the bottom and right edges", () => {
    expect(clampChatPosition({ left: 1800, top: 1000 }, panel, screen)).toEqual({ left: 1028, top: 328 });
  });
  it("repositions an existing chat when the viewport shrinks", () => {
    expect(clampChatPosition({ left: 1028, top: 328 }, panel, { width: 800, height: 700 }))
      .toEqual({ left: 388, top: 128 });
  });
  it("never produces negative positions when the keyboard leaves less room than the panel", () => {
    expect(clampChatPosition({ left: 100, top: 100 }, panel, { width: 320, height: 250 }))
      .toEqual({ left: 12, top: 12 });
  });
});

describe("chat panel resizing", () => {
  const screen = { width: 1440, height: 900 };
  const anchor = { left: 100, top: 100 };
  it("allows larger sizes while preserving the top-left position", () => {
    expect(resizeChatBounds({ width: 600, height: 700 }, anchor, screen))
      .toEqual({ position: anchor, size: { width: 600, height: 700 } });
  });
  it("keeps room for controls when shrinking", () => {
    expect(resizeChatBounds({ width: -10, height: 40 }, anchor, screen).size)
      .toEqual({ width: 300, height: 320 });
  });
  it("limits growth to the visible space to the right and below the panel", () => {
    expect(resizeChatBounds({ width: 5000, height: 5000 }, anchor, screen))
      .toEqual({ position: anchor, size: { width: 1328, height: 788 } });
  });
  it("fits inside a viewport smaller than the normal minimum size", () => {
    expect(resizeChatBounds({ width: 400, height: 560 }, { left: 0, top: 0 }, { width: 320, height: 250 }))
      .toEqual({ position: { left: 12, top: 12 }, size: { width: 296, height: 226 } });
  });
  it("moves the anchor back on screen if the window shrinks during resizing", () => {
    expect(resizeChatBounds({ width: 400, height: 560 }, { left: 900, top: 600 }, { width: 500, height: 450 }))
      .toEqual({ position: { left: 188, top: 118 }, size: { width: 300, height: 320 } });
  });
});
