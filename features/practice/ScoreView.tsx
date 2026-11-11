"use client";

import { useEffect } from "react";
import { useTranslation } from "@/common/i18n";
import { LoadingState } from "@/common/components";
import type { PracticeApiClient } from "./api";
import type { PracticeItemResult } from "./contracts";
import { formatSubScore, subScoreLabel } from "./score-labels";
import { AnswerFeedback } from "./feedback/AnswerFeedback";
import { ScoringRequest } from "./feedback/ScoringRequest";
import { useItemResult } from "./useItemResult";

export { formatSubScore, subScoreLabel };

interface ScoreViewProps {
  api: PracticeApiClient;
  sessionId: string;
  itemId: string;
  initial: PracticeItemResult | null;
  /** Compact layout for the review list; the session view uses the full card. */
  compact?: boolean;
  /** False in a mock test, whose answers are scored together from the report's own button. */
  canRequestScoring?: boolean;
  /** Told about every newer result, so a parent that remounts this view can start from it. */
  onResultChange?: (result: PracticeItemResult) => void;
}

/** Score of one answered item: waits for scoring, then shows score, breakdown, feedback and transcript. */
export function ScoreView({ api, sessionId, itemId, initial, compact = false, canRequestScoring = true, onResultChange }: ScoreViewProps) {
  const { t } = useTranslation();
  const { result, watch, retrying, retryError, recheck, retryScoring, requestScoring } =
    useItemResult(api, sessionId, itemId, initial);
  useEffect(() => {
    if (result && result !== initial) onResultChange?.(result);
  }, [result, initial, onResultChange]);
  const className = `score-panel${compact ? " score-panel-compact" : ""}`;

  if (watch === "timeout" || watch === "error") {
    return (
      <div className={className} role="status">
        <p>{t("score.timeout")}</p>
        <button className="button button-muted" type="button" onClick={recheck}>{t("score.checkAgain")}</button>
      </div>
    );
  }
  if (!result || result.state === "SCORING") {
    return (
      <div className={className} role="status" aria-live="polite">
        <LoadingState compact message={t("score.scoring")} />
        <small>{t("score.scoringHint")}</small>
      </div>
    );
  }
  if (result.state === "FAILED") {
    return (
      <div className={className} role="alert">
        <p>{t("score.failed")}</p>
        {result.retryable ? (
          <button className="button button-outline button-pill" type="button" disabled={retrying} onClick={retryScoring}>
            {retrying ? t("score.retrying") : t("score.retry")}
          </button>
        ) : <small>{t("score.retryLimit")}</small>}
        {retryError ? <small>{retryError}</small> : null}
      </div>
    );
  }
  if (result.state === "NONE") {
    return (
      <div className={className}>
        <ScoringRequest canRequest={canRequestScoring} requesting={retrying} error={retryError}
          onRequest={requestScoring} />
      </div>
    );
  }
  if (result.score === null) {
    return <div className={className}><p>{t("score.notScoredYet")}</p></div>;
  }

  const subScores = Object.entries(result.subScores);
  return (
    <div className={className} data-testid="practice-score">
      {result.transcript ? <div className="score-transcript"><h3>{t("score.transcript")}</h3><p>{result.transcript}</p></div> : null}
      <p className="score-value"><strong>{result.score}</strong> <span>{t("score.outOf")}</span></p>
      {subScores.length > 0 ? (
        <div className="score-breakdown">
          <h3>{t("score.subScores")}</h3>
          <ul>{subScores.map(([key, value]) => (
            <li key={key}><span>{subScoreLabel(key)}</span><strong>{formatSubScore(value, result.subScoreMax?.[key])}</strong></li>
          ))}</ul>
        </div>
      ) : null}
      {result.feedback ? <div className="score-feedback"><h3>{t("score.feedback")}</h3><p>{result.feedback}</p></div> : null}
      <AnswerFeedback result={result} />
    </div>
  );
}
