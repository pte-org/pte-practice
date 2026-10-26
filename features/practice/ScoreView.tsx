"use client";

import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "./api";
import type { PracticeItemResult } from "./contracts";
import { useItemResult } from "./useItemResult";

interface ScoreViewProps {
  api: PracticeApiClient;
  sessionId: string;
  itemId: string;
  initial: PracticeItemResult | null;
  /** Compact layout for the review list; the session view uses the full card. */
  compact?: boolean;
}

/** Score of one answered item: waits for scoring, then shows score, breakdown, feedback and transcript. */
export function ScoreView({ api, sessionId, itemId, initial, compact = false }: ScoreViewProps) {
  const { t } = useTranslation();
  const { result, watch, retrying, retryError, recheck, retryScoring } = useItemResult(api, sessionId, itemId, initial);
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
        <span className="loading-dot" />
        <p>{t("score.scoring")}</p>
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
  if (result.state === "NONE" || result.score === null) {
    return <div className={className}><p>{t("score.notScoredYet")}</p></div>;
  }

  const subScores = Object.entries(result.subScores);
  return (
    <div className={className} data-testid="practice-score">
      <p className="score-value"><strong>{result.score}</strong> <span>{t("score.outOf")}</span></p>
      {subScores.length > 0 ? (
        <div className="score-breakdown">
          <h3>{t("score.subScores")}</h3>
          <ul>{subScores.map(([key, value]) => <li key={key}><span>{subScoreLabel(key)}</span><strong>{value}</strong></li>)}</ul>
        </div>
      ) : null}
      {result.feedback ? <div className="score-feedback"><h3>{t("score.feedback")}</h3><p>{result.feedback}</p></div> : null}
      {result.transcript ? <div className="score-transcript"><h3>{t("score.transcript")}</h3><p>{result.transcript}</p></div> : null}
    </div>
  );
}

/** "oralFluency" / "oral_fluency" -> "Oral fluency". */
export function subScoreLabel(key: string): string {
  const words = key.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
