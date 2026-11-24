import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { PracticeApiClient } from "../api";
import type { PracticeSession } from "../contracts";
import { historyFromReview, type HistoryItem } from "./session-history";

/**
 * Rebuilds the "Trước" history of a resumed session (one that already has answered or skipped questions) from its
 * review, once per session. A failed review fetch is not fatal: the session simply starts with no history.
 */
export function useHistoryHydration(
  api: PracticeApiClient,
  session: PracticeSession | null,
  hydratedSessionRef: MutableRefObject<string | null>,
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>,
): void {
  useEffect(() => {
    if (!session || hydratedSessionRef.current === session.publicId) return;
    if (session.answeredItemCount > 0 || (session.currentTask && session.currentTask.orderIndex > 0)) {
      hydratedSessionRef.current = session.publicId;
      void api.getReview(session.publicId).then((review) => {
        const newHistory = historyFromReview(review.items);
        if (newHistory.length === 0) return;
        setHistory((prev) => (prev.length === 0 ? newHistory : prev));
      }).catch(() => undefined);
    }
  }, [api, session, hydratedSessionRef, setHistory]);
}
