import type { PracticeApiClient } from "../api";
import { uploadPracticeRecording } from "../media/api";
import { createRecordingCommitter } from "../media/recordingDrafts";
import type { PracticeSession } from "../contracts";
import { isVersionConflict } from "./session-draft";

interface RecordingDraft {
  sessionId: string;
  itemId: string;
  payload: Record<string, unknown>;
}

type RecordingDraftSaver = (api: PracticeApiClient, entries: RecordingDraft[], excludeItemId: string | undefined,
  sessionRef: { current: PracticeSession | null }, key: string,
  forget: (sessionId: string, itemId: string) => void) => Promise<void>;

/** Keeps each draft request identical if the server applied it but its response was lost. */
export function createRecordingDraftSaver(): RecordingDraftSaver {
  const requests = new WeakMap<Blob, { key: string; request: { clientVersion: number; payload: string; confidence: null } }>();
  const commit = createRecordingCommitter();
  return async (api: PracticeApiClient, entries: RecordingDraft[], excludeItemId: string | undefined,
    sessionRef: { current: PracticeSession | null }, key: string,
    forget: (sessionId: string, itemId: string) => void): Promise<void> => {
    for (const entry of entries) {
      if (entry.itemId === excludeItemId) continue;
      const blob = entry.payload.recordingBlob;
      if (!(blob instanceof Blob)) continue;
      const payload = await commit(entry.payload, (audio, duration) =>
        uploadPracticeRecording(api, audio, entry.sessionId, entry.itemId, duration));
      const current = sessionRef.current;
      if (!current) return;
      let savedRequest = requests.get(blob);
      if (!savedRequest) {
        savedRequest = { key: `${key}:${entry.itemId}`, request: { clientVersion: current.version, payload: JSON.stringify(payload), confidence: null } };
        requests.set(blob, savedRequest);
      }
      try {
        sessionRef.current = await api.saveDraft(current.publicId, entry.itemId, savedRequest.request, savedRequest.key);
      } catch (reason) {
        if (isVersionConflict(reason)) requests.delete(blob);
        throw reason;
      }
      forget(entry.sessionId, entry.itemId);
    }
  };
}
