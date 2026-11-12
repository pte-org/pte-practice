"use client";

import { useEffect } from "react";
import type { PracticeApiClient } from "../api";
import type { PracticeItemResult } from "../contracts";
import { ScoringRequest } from "../feedback/ScoringRequest";
import { useItemResult } from "../useItemResult";
import { InlineResultFailed, InlineResultScoring, InlineResultTimeout } from "./_InlineResultStates";
import { InlineScoredCard } from "./_InlineScoredCard";

export interface InlineResultCardProps {
  api: PracticeApiClient;
  sessionId: string;
  itemId: string;
  initialResult: PracticeItemResult | null;
  timeSpentSeconds?: number;
  /** False in a mock test: its speaking and writing answers are scored together once the test is submitted. */
  canRequestScoring?: boolean;
  onResultSettled?: (result: PracticeItemResult) => void;
}

/**
 * Inline result and explanation card displayed directly inside the practice session task view,
 * underneath the question card once submitted. A speaking or writing answer waits for "Chấm điểm".
 */
export function InlineResultCard(props: InlineResultCardProps) {
  if (!props.initialResult) {
    return null;
  }
  return <InlineResultCardInner {...props} initialResult={props.initialResult} />;
}

function timedOutResult(itemId: string, watch: string): PracticeItemResult {
  return {
    itemPublicId: itemId, taskCode: "", state: "FAILED", score: 0, scoreStatus: null, subScores: {}, feedback: null,
    transcript: null, failureCode: watch.toUpperCase(), retryable: true, scoredAt: null,
  };
}

function InlineResultCardInner({
  api,
  sessionId,
  itemId,
  initialResult,
  timeSpentSeconds,
  canRequestScoring = true,
  onResultSettled,
}: InlineResultCardProps & { initialResult: PracticeItemResult }) {
  const { result, watch, retrying, retryError, recheck, retryScoring, requestScoring } = useItemResult(
    api,
    sessionId,
    itemId,
    initialResult,
  );

  useEffect(() => {
    if (result && result.state !== "SCORING") {
      onResultSettled?.(result);
    } else if (watch === "timeout" || watch === "error") {
      onResultSettled?.(result ?? timedOutResult(itemId, watch));
    }
  }, [result, watch, itemId, onResultSettled]);

  if (watch === "timeout" || watch === "error") return <InlineResultTimeout onRecheck={recheck} />;
  if (!result || result.state === "SCORING") return <InlineResultScoring />;
  if (result.state === "FAILED") {
    return <InlineResultFailed retryable={result.retryable} retrying={retrying} retryError={retryError}
      onRetry={retryScoring} />;
  }
  if (result.state === "NONE") {
    return (
      <div className="inline-result-card inline-result-status-card" data-testid="inline-result-unscored">
        <ScoringRequest canRequest={canRequestScoring} requesting={retrying} error={retryError}
          onRequest={requestScoring} />
      </div>
    );
  }
  return <InlineScoredCard result={result} timeSpentSeconds={timeSpentSeconds} />;
}
