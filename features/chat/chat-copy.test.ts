import { describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./chat-copy";

describe("copyToClipboard", () => {
  it("writes the text and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyToClipboard("hello", { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("reports failure when the browser refuses", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    await expect(copyToClipboard("hello", { writeText })).resolves.toBe(false);
  });

  it("reports failure when the clipboard API is missing", async () => {
    await expect(copyToClipboard("hello", undefined)).resolves.toBe(false);
  });

  it("reports failure when writeText throws synchronously", async () => {
    const writeText = vi.fn(() => {
      throw new Error("boom");
    });
    await expect(copyToClipboard("hello", { writeText })).resolves.toBe(false);
  });

  it("does not copy an empty answer", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyToClipboard("   ", { writeText })).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});
