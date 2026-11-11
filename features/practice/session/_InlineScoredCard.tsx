"use client";

import { AppIcon } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import type { PracticeItemResult } from "../contracts";
import { AnswerFeedback } from "../feedback/AnswerFeedback";
import { formatSubScore, subScoreLabel } from "../score-labels";

const FULL_SCORE = 100;
const PASS_SCORE = 60;

interface Verdict {
  textKey: TranslationKey;
  tone: "correct" | "incorrect" | "partial";
  icon: "checkCircle" | "closeCircle";
}

function verdictOf(score: number): Verdict {
  if (score >= PASS_SCORE) return { textKey: "session.correct", tone: "correct", icon: "checkCircle" };
  if (score === 0) return { textKey: "session.incorrect", tone: "incorrect", icon: "closeCircle" };
  return { textKey: "session.partiallyCorrect", tone: "partial", icon: "closeCircle" };
}

interface InlineScoredCardProps {
  result: PracticeItemResult;
  timeSpentSeconds?: number;
}

/** A scored answer inside the session: verdict, score, time, trait scores, what was heard, feedback and tips. */
export function InlineScoredCard({ result, timeSpentSeconds }: InlineScoredCardProps) {
  const { t } = useTranslation();
  const score = result.score ?? 0;
  const verdict = verdictOf(score);
  const subScoreEntries = Object.entries(result.subScores ?? {});
  return (
    <div className="inline-result-card" data-testid="inline-result-card">
      <div className="inline-result-banner">
        <div className={`inline-result-verdict inline-verdict-${verdict.tone}`}>
          <AppIcon name={verdict.icon} size={22} />
          <strong>{t(verdict.textKey)}</strong>
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
          <strong className="inline-metric-value">{score} / {FULL_SCORE}</strong>
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
              <strong className="inline-subscore-value">{formatSubScore(val, result.subScoreMax?.[key])}</strong>
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
      <AnswerFeedback result={result} />
    </div>
  );
}
