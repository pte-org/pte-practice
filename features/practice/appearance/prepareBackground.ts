import {
  BACKGROUND_INPUT_TYPES, BACKGROUND_JPEG_QUALITY, MAX_BACKGROUND_DATA_LENGTH,
  MAX_BACKGROUND_FILE_BYTES, MAX_BACKGROUND_HEIGHT, MAX_BACKGROUND_PIXELS, MAX_BACKGROUND_WIDTH,
} from "./constants";

export type BackgroundImageIssue = "type" | "size" | "decode";

export class BackgroundImageError extends Error {
  constructor(public readonly issue: BackgroundImageIssue) { super(issue); }
}

/** Re-encoding strips metadata and limits storage size; the original file never leaves the device. */
export async function prepareBackground(file: File): Promise<string> {
  if (!BACKGROUND_INPUT_TYPES.some((type) => type === file.type)) throw new BackgroundImageError("type");
  if (file.size > MAX_BACKGROUND_FILE_BYTES) throw new BackgroundImageError("size");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new BackgroundImageError("decode"); }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > MAX_BACKGROUND_PIXELS) {
      throw new BackgroundImageError("size");
    }
    const scale = Math.min(1, MAX_BACKGROUND_WIDTH / bitmap.width, MAX_BACKGROUND_HEIGHT / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new BackgroundImageError("decode");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", BACKGROUND_JPEG_QUALITY);
    if (image.length > MAX_BACKGROUND_DATA_LENGTH) throw new BackgroundImageError("size");
    return image;
  } finally { bitmap.close(); }
}
