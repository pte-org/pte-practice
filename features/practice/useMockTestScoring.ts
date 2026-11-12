"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeApiClient } from "./api";
import type { PracticeReview } from "./contracts";
import { POLL_MAX_DELAY_MS, POLL_TIMEOUT_MS } from "./scoring-poll";

/** Unscored and still-scoring answers of a review, from each answer's scoring state. */
export function scoringCounts(review: PracticeReview): { unscored: number; scoring: number } {
  let unscored = 0;
  let scoring = 0;
  for (const item of review.items) {
    if (item.result?.state === "NONE") unscored += 1;
    if (item.result?.state === "SCORING") scoring += 1;
  }
  return { unscored, scoring };
}

export interface MockTestScoringControls {
  requesting: boolean;
  failed: boolean;
  /** "Chấm điểm": queue every unscored answer, then refresh the review until none is scoring. */
  scoreAll: () => void;
}

/**
 * The finished mock test's "Chấm điểm". After the request, and whenever the review is opened while answers are still
 * scoring, the review is reloaded every few seconds so each answer's result and the estimated scores appear as they
 * settle.
 */
export function useMockTestScoring(api: PracticeApiClient, review: PracticeReview,
  onReview: (review: PracticeReview) => void): MockTestScoringControls {
  const [requesting, setRequesting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [watchRun, setWatchRun] = useState(0);
  const scoring = scoringCounts(review).scoring;
  const sessionId = review.sessionPublicId;
  const onReviewRef = useRef(onReview);

  useEffect(() => {
    onReviewRef.current = onReview;
  }, [onReview]);

  useEffect(() => {
    if (scoring === 0) return;
    const startedAt = Date.now();
    let cancelled = false;
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS * 5) {
        window.clearInterval(timer);
        return;
      }
      void api.getReview(sessionId).then((next) => {
        if (!cancelled) onReviewRef.current(next);
      }).catch(() => undefined);
    }, POLL_MAX_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [api, sessionId, scoring, watchRun]);

  const scoreAll = useCallback(() => {
    setRequesting(true);
    setFailed(false);
    api.requestMockTestScoring(sessionId)
      .then(() => api.getReview(sessionId))
      .then((next) => {
        onReviewRef.current(next);
        setWatchRun((run) => run + 1);
      })
      .catch(() => setFailed(true))
      .finally(() => setRequesting(false));
  }, [api, sessionId]);

  return { requesting, failed, scoreAll };
}
