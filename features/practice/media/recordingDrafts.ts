import type { RecordedPracticeMedia } from "./contracts";

export function hasLocalRecording(value: Record<string, unknown>): boolean {
  return typeof Blob !== "undefined" && value.recordingBlob instanceof Blob;
}

/** Uploads only at an explicit commit; a retry reuses an already uploaded take. */
export function createRecordingCommitter(): (
  value: Record<string, unknown>,
  upload: (blob: Blob, durationSeconds: number) => Promise<RecordedPracticeMedia>,
) => Promise<Record<string, unknown>> {
  const uploads = new WeakMap<Blob, Promise<RecordedPracticeMedia>>();
  return async (value, upload) => {
    const blob = value.recordingBlob;
    if (!(blob instanceof Blob)) return value;
    let pending = uploads.get(blob);
    if (!pending) {
      pending = upload(blob, typeof value.durationSeconds === "number" ? value.durationSeconds : 0);
      uploads.set(blob, pending);
      void pending.catch(() => uploads.delete(blob));
    }
    const media = await pending;
    return { mediaPublicId: media.mediaPublicId, durationSeconds: media.durationSeconds };
  };
}
