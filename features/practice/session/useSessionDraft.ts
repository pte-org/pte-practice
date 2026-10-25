"use client";

import { useCallback, useState } from "react";
import type { PracticeSession, ResponseConfidence } from "../contracts";
import { getPracticeDraft, savePracticeDraft } from "../session-storage";

/**
 * The student's unsent answer for the current item. A local draft belongs to one item (`draftTaskId`); for any other
 * item the answer the server saved is shown instead (see `effectiveDraft`).
 */
export function useSessionDraft() {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ResponseConfidence | null>(null);

  /** Re-reads the draft kept in this browser for the session's current item. */
  const hydrateDraft = useCallback((session: PracticeSession) => {
    const task = session.currentTask;
    if (!task) {
      setDraftTaskId(null);
      setDraft({});
      setConfidence(null);
      return;
    }
    const localDraft = getPracticeDraft(session.publicId, task.publicId);
    setDraftTaskId(localDraft ? task.publicId : null);
    setDraft(localDraft?.payload ?? {});
    setConfidence(task.confidence);
  }, []);

  const editAnswer = useCallback((sessionPublicId: string, itemPublicId: string, value: Record<string, unknown>) => {
    setDraftTaskId(itemPublicId);
    setDraft(value);
    savePracticeDraft(sessionPublicId, itemPublicId, value);
  }, []);

  const chooseConfidence = useCallback((itemPublicId: string, level: ResponseConfidence) => {
    setDraftTaskId(itemPublicId);
    setConfidence(level);
  }, []);

  return { draft, draftTaskId, confidence, hydrateDraft, editAnswer, chooseConfidence };
}
