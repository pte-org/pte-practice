import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRecordingDraftSaver } from "@/features/practice/session/recordingCommit";
import { uploadPracticeRecording } from "@/features/practice/media/api";
import type { PracticeApiClient } from "@/features/practice/api";
import type { PracticeSession } from "@/features/practice/contracts";

vi.mock("@/features/practice/media/api", () => ({ uploadPracticeRecording: vi.fn() }));

const session = (version: number): PracticeSession => ({
  publicId: "session", version, sourceType: "PRACTICE", productCode: "PTE_CORE", title: "Practice",
  organizationId: "org", catalogVersion: "1", timeLimitSeconds: 0, status: "IN_PROGRESS",
  startedAt: null, deadlineAt: null, completedAt: null, discardedAt: null, saveAndExitAvailable: true,
  canAdvance: true, nextAction: null, answeredItemCount: 0, totalItemCount: 10, sections: [],
  currentTask: null, itemResult: null, timingMode: "UNTIMED", questionCount: 10,
  kind: "TASK", skillCode: "SPEAKING", taskCode: "READ_ALOUD",
});
const draft = (itemId: string) => ({ sessionId: "session", itemId,
  payload: { recordingBlob: new Blob([itemId]), durationSeconds: 5 } });

beforeEach(() => {
  vi.mocked(uploadPracticeRecording).mockReset();
  vi.mocked(uploadPracticeRecording).mockResolvedValue({ mediaPublicId: "media", durationSeconds: 5, contentType: "audio/wav" });
});

describe("committing recordings from other visited questions", () => {
  it("saves the other questions before completion, skips the submitted item, and advances versions", async () => {
    const saveDraft = vi.fn().mockResolvedValueOnce(session(2)).mockResolvedValueOnce(session(3));
    // Only saveDraft is exercised by this helper; media upload is mocked at its boundary.
    const api = { saveDraft } as unknown as PracticeApiClient;
    const ref = { current: session(1) };
    const forget = vi.fn();
    await createRecordingDraftSaver()(api, [draft("first"), draft("second"), draft("current")], "current", ref, "submit", forget);
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(saveDraft.mock.calls[0][2].clientVersion).toBe(1);
    expect(saveDraft.mock.calls[1][2].clientVersion).toBe(2);
    expect(ref.current.version).toBe(3);
    expect(forget.mock.calls).toEqual([["session", "first"], ["session", "second"]]);
  });

  it("replays the exact request and key after a lost response even when the version advanced", async () => {
    const saveDraft = vi.fn().mockRejectedValueOnce(new Error("lost response")).mockResolvedValueOnce(session(7));
    // The API surface used here is limited to draft saves.
    const api = { saveDraft } as unknown as PracticeApiClient;
    const ref = { current: session(1) };
    const entries = [draft("other")];
    const save = createRecordingDraftSaver();
    const forget = vi.fn();
    await expect(save(api, entries, "current", ref, "exit", forget)).rejects.toThrow("lost response");
    expect(forget).not.toHaveBeenCalled();
    ref.current = session(6);
    await save(api, entries, "current", ref, "submit", forget);
    expect(saveDraft.mock.calls[1]).toEqual(saveDraft.mock.calls[0]);
    expect(uploadPracticeRecording).toHaveBeenCalledOnce();
    expect(forget).toHaveBeenCalledOnce();
  });

  it("does not forget unsaved takes when a later upload fails", async () => {
    const saveDraft = vi.fn().mockResolvedValue(session(2));
    // Only draft-saving behavior is under test.
    const api = { saveDraft } as unknown as PracticeApiClient;
    const entries = [draft("first"), draft("second")];
    vi.mocked(uploadPracticeRecording).mockResolvedValueOnce({ mediaPublicId: "first", durationSeconds: 5, contentType: "audio/wav" })
      .mockRejectedValueOnce(new Error("offline"));
    const forget = vi.fn();
    await expect(createRecordingDraftSaver()(api, entries, "current", { current: session(1) }, "exit", forget)).rejects.toThrow("offline");
    expect(forget.mock.calls).toEqual([["session", "first"]]);
  });
});
