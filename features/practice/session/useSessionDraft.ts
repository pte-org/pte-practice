"use client";

import { useCallback, useRef, useState } from "react";
import type { PracticeSession } from "../contracts";
import { clearPracticeDraft, getPracticeDraft, savePracticeDraft } from "../session-storage";
import { hasLocalRecording } from "../media/recordingDrafts";

/**
 * The student's unsent answer for the current item. A local draft belongs to one item (`draftTaskId`); for any other
 * item the answer the server saved is shown instead (see `effectiveDraft`).
 */
export function useSessionDraft() {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const recordings = useRef(new Map<string, { sessionId: string; itemId: string; payload: Record<string, unknown> }>());
  const [hasRecordingDrafts, setHasRecordingDrafts] = useState(false);

  const readDraft = useCallback((sessionId: string, itemId: string) =>
    recordings.current.get(`${sessionId}:${itemId}`) ?? getPracticeDraft(sessionId, itemId), []);

  const forgetDraft = useCallback((sessionId: string, itemId: string) => {
    recordings.current.delete(`${sessionId}:${itemId}`);
    setHasRecordingDrafts(recordings.current.size > 0);
    clearPracticeDraft(sessionId, itemId);
  }, []);

  const recordingDrafts = useCallback((sessionId: string) =>
    [...recordings.current.values()].filter((entry) => entry.sessionId === sessionId), []);

  /** Re-reads the draft kept in this browser for the session's current item. */
  const hydrateDraft = useCallback((session: PracticeSession) => {
    const task = session.currentTask;
    if (!task) {
      setDraftTaskId(null);
      setDraft({});
      return;
    }
    const localDraft = readDraft(session.publicId, task.publicId);
    setDraftTaskId(localDraft ? task.publicId : null);
    setDraft(localDraft?.payload ?? {});
  }, [readDraft]);

  const editAnswer = useCallback((sessionPublicId: string, itemPublicId: string, value: Record<string, unknown>) => {
    setDraftTaskId(itemPublicId);
    setDraft(value);
    if (hasLocalRecording(value)) {
      recordings.current.set(`${sessionPublicId}:${itemPublicId}`, { sessionId: sessionPublicId, itemId: itemPublicId, payload: value });
      clearPracticeDraft(sessionPublicId, itemPublicId);
    } else {
      recordings.current.delete(`${sessionPublicId}:${itemPublicId}`);
      savePracticeDraft(sessionPublicId, itemPublicId, value);
    }
    setHasRecordingDrafts(recordings.current.size > 0);
  }, []);

  return { draft, draftTaskId, setDraft, setDraftTaskId, hydrateDraft, editAnswer, readDraft, forgetDraft,
    recordingDrafts, hasRecordingDrafts };
}
