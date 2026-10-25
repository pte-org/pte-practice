"use client";

import { useCallback, useState } from "react";
import type { PracticeSession } from "../contracts";
import { getPracticeDraft, savePracticeDraft } from "../session-storage";

/**
 * The student's unsent answer for the current item. A local draft belongs to one item (`draftTaskId`); for any other
 * item the answer the server saved is shown instead (see `effectiveDraft`).
 */
export function useSessionDraft() {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);

  /** Re-reads the draft kept in this browser for the session's current item. */
  const hydrateDraft = useCallback((session: PracticeSession) => {
    const task = session.currentTask;
    if (!task) {
      setDraftTaskId(null);
      setDraft({});
      return;
    }
    const localDraft = getPracticeDraft(session.publicId, task.publicId);
    setDraftTaskId(localDraft ? task.publicId : null);
    setDraft(localDraft?.payload ?? {});
  }, []);

  const editAnswer = useCallback((sessionPublicId: string, itemPublicId: string, value: Record<string, unknown>) => {
    setDraftTaskId(itemPublicId);
    setDraft(value);
    savePracticeDraft(sessionPublicId, itemPublicId, value);
  }, []);

  return { draft, draftTaskId, setDraft, setDraftTaskId, hydrateDraft, editAnswer };
}
