import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareBackground } from "@/features/practice/appearance/prepareBackground";
import { MAX_BACKGROUND_DATA_LENGTH, MAX_BACKGROUND_FILE_BYTES } from "@/features/practice/appearance/constants";

afterEach(() => vi.unstubAllGlobals());

describe("preparing a local practice background", () => {
  it("rejects unsupported formats and files exceeding the input limit before decoding", async () => {
    await expect(prepareBackground(new File(["svg"], "bg.svg", { type: "image/svg+xml" }))).rejects.toMatchObject({ issue: "type" });
    const file = new File([new Uint8Array(MAX_BACKGROUND_FILE_BYTES + 1)], "large.jpg", { type: "image/jpeg" });
    await expect(prepareBackground(file)).rejects.toMatchObject({ issue: "size" });
  });

  it("resizes to bounded dimensions, re-encodes to JPEG and releases the bitmap", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    const toDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,YWJj");
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toDataURL };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 3200, height: 2000, close }));
    vi.stubGlobal("document", { createElement: () => canvas });
    await expect(prepareBackground(new File(["image"], "bg.png", { type: "image/png" }))).resolves.toContain("data:image/jpeg");
    expect([canvas.width, canvas.height]).toEqual([1600, 1000]);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.78);
    expect(close).toHaveBeenCalledOnce();
  });

  it("releases decoded memory when the compressed image is too big", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 1600, height: 1000, close }));
    vi.stubGlobal("document", { createElement: () => ({ getContext: () => ({ drawImage: vi.fn() }), toDataURL: () => "x".repeat(MAX_BACKGROUND_DATA_LENGTH + 1) }) });
    await expect(prepareBackground(new File(["image"], "bg.jpg", { type: "image/jpeg" }))).rejects.toMatchObject({ issue: "size" });
    expect(close).toHaveBeenCalledOnce();
  });

  it("reports invalid image bytes without requesting any network resource", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("invalid")));
    await expect(prepareBackground(new File(["bad"], "bg.jpg", { type: "image/jpeg" }))).rejects.toMatchObject({ issue: "decode" });
  });
});
