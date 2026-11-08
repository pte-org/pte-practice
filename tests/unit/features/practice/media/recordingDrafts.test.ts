import { describe, expect, it, vi } from "vitest";
import { createRecordingCommitter, hasLocalRecording } from "@/features/practice/media/recordingDrafts";
import { hasAnswer } from "@/features/practice/session/session-draft";
import type { RecordedPracticeMedia } from "@/features/practice/media/contracts";

const media: RecordedPracticeMedia = { mediaPublicId: "saved-take", durationSeconds: 5, contentType: "audio/wav" };
const take = (content = "audio") => ({ recordingBlob: new Blob([content], { type: "audio/wav" }), durationSeconds: 5 });

describe("deferred recording commits", () => {
  it("recognizes a local recording as an answer without a server media id", () => {
    expect(hasLocalRecording(take())).toBe(true);
    expect(hasAnswer(take())).toBe(true);
    expect(hasLocalRecording({ recordingBlob: {} })).toBe(false);
  });

  it("does not upload any takes until an explicit commit, and sends only the selected take", async () => {
    const upload = vi.fn().mockResolvedValue(media);
    const commit = createRecordingCommitter();
    let draft = take("first");
    draft = take("second");
    draft = take("last");
    expect(upload).not.toHaveBeenCalled();
    const payload = await commit(draft, upload);
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledWith(draft.recordingBlob, 5);
    expect(payload).toEqual({ mediaPublicId: "saved-take", durationSeconds: 5 });
    expect(payload).not.toHaveProperty("recordingBlob");
  });

  it("reuses an upload after answer/save-and-exit fails, including concurrent retries", async () => {
    const upload = vi.fn().mockResolvedValue(media);
    const commit = createRecordingCommitter();
    const draft = take();
    await Promise.all([commit(draft, upload), commit(draft, upload)]);
    await commit(draft, upload);
    expect(upload).toHaveBeenCalledOnce();
  });

  it("keeps the blob after upload failure and allows retry", async () => {
    const upload = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(media);
    const commit = createRecordingCommitter();
    const draft = take();
    await expect(commit(draft, upload)).rejects.toThrow("network");
    expect(hasLocalRecording(draft)).toBe(true);
    await expect(commit(draft, upload)).resolves.toEqual({ mediaPublicId: "saved-take", durationSeconds: 5 });
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it("uploads a replacement take independently and leaves text or existing media unchanged", async () => {
    const upload = vi.fn().mockResolvedValue(media);
    const commit = createRecordingCommitter();
    await commit(take("first"), upload);
    await commit(take("retake"), upload);
    const saved = { mediaPublicId: "existing", durationSeconds: 8 };
    expect(await commit(saved, upload)).toBe(saved);
    expect(await commit({ text: "answer" }, upload)).toEqual({ text: "answer" });
    expect(upload).toHaveBeenCalledTimes(2);
  });
});
