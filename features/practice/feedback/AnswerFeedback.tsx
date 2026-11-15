"use client";

import { useTranslation } from "@/common/i18n";
import type { PracticeItemResult } from "../contracts";
import type { WordMark } from "../feedback-contracts";
import { formatSubScore, subScoreLabel } from "../score-labels";

interface AnswerFeedbackProps {
  result: PracticeItemResult;
}

/**
 * The feedback of a scored speaking or writing answer, shared by the session card, the review and the mock test
 * report: each trait with the reason for its level, the word check of a read-out task, then the tips.
 */
export function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const { t } = useTranslation();
  const detail = result.feedbackDetail;
  if (!detail) return null;
  const reasons = Object.entries(detail.traitReasons);
  return (
    <div className="answer-feedback" data-testid="answer-feedback">
      {reasons.length > 0 ? (
        <section className="inline-result-section answer-feedback-section-traits">
          <h4>{t("score.traitReasons")}</h4>
          <ul className="answer-feedback-reasons">
            {reasons.map(([trait, reason]) => (
              <li key={trait}>
                <strong>{subScoreLabel(trait)}</strong>
                {result.subScores[trait] !== undefined
                  ? <span className="answer-feedback-band">{formatSubScore(result.subScores[trait],
                    result.subScoreMax?.[trait])}</span> : null}
                <p>{reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {detail.wordMarks.length > 0 ? <WordCheck marks={detail.wordMarks} /> : null}
      {detail.tips.length > 0 ? (
        <section className="inline-result-section answer-feedback-section-tips">
          <h4>{t("score.tips")}</h4>
          <ul className="answer-feedback-tips">{detail.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}

function WordCheck({ marks }: { marks: WordMark[] }) {
  const { t } = useTranslation();
  const omitted = marks.filter((mark) => mark.mark === "OMITTED");
  const inserted = marks.filter((mark) => mark.mark === "INSERTED");
  return (
    <section className="inline-result-section answer-feedback-section-words" data-testid="answer-feedback-words">
      <h4>{t("score.wordMarks")}</h4>
      {omitted.length > 0 ? <WordRow label={t("score.omittedWords")} marks={omitted} tone="omitted" /> : null}
      {inserted.length > 0 ? <WordRow label={t("score.insertedWords")} marks={inserted} tone="inserted" /> : null}
    </section>
  );
}

function WordRow({ label, marks, tone }: { label: string; marks: WordMark[]; tone: "omitted" | "inserted" }) {
  return (
    <p className="answer-feedback-words">
      <span className="answer-feedback-words-label">{label}</span>
      {marks.map((mark, index) => (
        <span key={`${mark.word}-${index}`} className={`answer-feedback-word answer-feedback-word-${tone}`}>
          {mark.word}
        </span>
      ))}
    </p>
  );
}
