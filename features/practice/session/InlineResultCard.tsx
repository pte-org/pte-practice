"use client";

import { useEffect } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeItemResult } from "../contracts";
import { subScoreLabel } from "../ScoreView";
import { useItemResult } from "../useItemResult";

export interface InlineResultCardProps {
  api: PracticeApiClient;
  sessionId: string;
  itemId: string;
  initialResult: PracticeItemResult | null;
  timeSpentSeconds?: number;
  onResultSettled?: (result: PracticeItemResult) => void;
}

/**
 * Inline result and explanation card displayed directly inside the practice session task view,
 * underneath the question card once submitted.
 */
export function InlineResultCard(props: InlineResultCardProps) {
  if (!props.initialResult) {
    return null;
  }
  return <InlineResultCardInner {...props} initialResult={props.initialResult} />;
}

function InlineResultCardInner({
  api,
  sessionId,
  itemId,
  initialResult,
  timeSpentSeconds,
  onResultSettled,
}: InlineResultCardProps & { initialResult: PracticeItemResult }) {
  const { t } = useTranslation();
  const { result, watch, retrying, retryError, recheck, retryScoring } = useItemResult(
    api,
    sessionId,
    itemId,
    initialResult,
  );

  useEffect(() => {
    if (result && result.state !== "SCORING") {
      onResultSettled?.(result);
    } else if (watch === "timeout" || watch === "error") {
      onResultSettled?.(
        result ?? {
          itemPublicId: itemId,
          taskCode: "",
          state: "FAILED",
          score: 0,
          scoreStatus: null,
          subScores: {},
          feedback: null,
          transcript: null,
          failureCode: watch.toUpperCase(),
          retryable: true,
          scoredAt: null,
        },
      );
    }
  }, [result, watch, itemId, onResultSettled]);

  if (watch === "timeout" || watch === "error") {
    return (
      <div className="inline-result-card inline-result-status-card" role="status" data-testid="inline-result-timeout">
        <div className="inline-result-status-inner">
          <AppIcon name="alert" size={22} className="inline-icon-alert" />
          <div className="inline-status-text">
            <p>{t("score.timeout")}</p>
            <button className="button button-outline button-pill inline-retry-btn" type="button" onClick={recheck}>
              {t("score.checkAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result || result.state === "SCORING") {
    return (
      <div className="inline-result-card inline-result-scoring" role="status" aria-live="polite" data-testid="inline-result-scoring">
        <div className="inline-scoring-bar">
          <span className="loading-dot" />
          <strong>{t("session.scoringInProgress")}</strong>
        </div>
        <small className="inline-scoring-hint">{t("score.scoringHint")}</small>
      </div>
    );
  }

  if (result.state === "FAILED") {
    return (
      <div className="inline-result-card inline-result-status-card" role="alert" data-testid="inline-result-failed">
        <div className="inline-result-status-inner">
          <AppIcon name="alert" size={22} className="inline-icon-alert" />
          <div className="inline-status-text">
            <p>{t("score.failed")}</p>
            {result.retryable ? (
              <button
                className="button button-outline button-pill inline-retry-btn"
                type="button"
                disabled={retrying}
                onClick={retryScoring}
              >
                {retrying ? t("score.retrying") : t("score.retry")}
              </button>
            ) : (
              <small className="inline-status-subtext">{t("score.retryLimit")}</small>
            )}
            {retryError ? <p className="inline-error-msg">{retryError}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  const score = result.score ?? 0;
  let verdictText = t("session.correct");
  let verdictTone: "correct" | "incorrect" | "partial" = "correct";
  let verdictIcon: "checkCircle" | "closeCircle" = "checkCircle";

  if (score >= 100) {
    verdictText = t("session.correct");
    verdictTone = "correct";
    verdictIcon = "checkCircle";
  } else if (score === 0) {
    verdictText = t("session.incorrect");
    verdictTone = "incorrect";
    verdictIcon = "closeCircle";
  } else if (score >= 60) {
    verdictText = t("session.correct");
    verdictTone = "correct";
    verdictIcon = "checkCircle";
  } else {
    verdictText = t("session.partiallyCorrect");
    verdictTone = "partial";
    verdictIcon = "closeCircle";
  }

  const subScoreEntries = result.subScores ? Object.entries(result.subScores) : [];

  return (
    <div className="inline-result-card" data-testid="inline-result-card">
      <div className="inline-result-banner">
        <div className={`inline-result-verdict inline-verdict-${verdictTone}`}>
          <AppIcon name={verdictIcon} size={22} />
          <strong>{verdictText}</strong>
        </div>
        <div className="inline-ai-badge">
          <AppIcon name="sparkle" size={14} />
          <span>PTE AI</span>
        </div>
      </div>

      <div className="inline-metrics-grid">
        <div className="inline-metric-card">
          <div className="inline-metric-header">
            <AppIcon name="star" size={17} className="inline-metric-icon-star" />
            <span>{t("session.scoreLabel")}</span>
          </div>
          <strong className="inline-metric-value">{score} / 100</strong>
        </div>

        <div className="inline-metric-card">
          <div className="inline-metric-header">
            <AppIcon name="timer" size={17} className="inline-metric-icon-timer" />
            <span>{t("session.speedLabel")}</span>
          </div>
          <strong className="inline-metric-value">
            {timeSpentSeconds ? t("session.secondsShort").replace("{s}", String(timeSpentSeconds)) : "--"}
          </strong>
        </div>
      </div>

      {subScoreEntries.length > 0 ? (
        <div className="inline-result-subscores">
          {subScoreEntries.map(([key, val]) => (
            <div key={key} className="inline-subscore-item">
              <span className="inline-subscore-label">{subScoreLabel(key)}</span>
              <strong className="inline-subscore-value">{val}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {result.transcript ? (
        <div className="inline-result-section">
          <h4>{t("session.whatWeHeard")}</h4>
          <p className="inline-result-text">{result.transcript}</p>
        </div>
      ) : null}

      {result.feedback ? (
        <div className="inline-result-section">
          <h4>{t("session.explanation")}</h4>
          <p className="inline-result-text">{result.feedback}</p>
        </div>
      ) : null}
    </div>
  );
}
