"use client";

import type { ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeItemResult, PracticeReviewItem } from "../contracts";
import { formatScore, scoreTone, skillKey } from "../presentation";
import { ScoreView } from "../ScoreView";
import { ReviewAnswerPane } from "./ReviewAnswerPane";
import { RubricCriteriaButton } from "./RubricCriteriaButton";

interface ReviewQuestionProps {
  item: PracticeReviewItem;
  sessionId: string;
  api: PracticeApiClient;
  canRequestScoring: boolean;
  onResultChange: (result: PracticeItemResult) => void;
}

/** One reviewed question as two separate panels: the question and answer on the left, the AI scoring on the right. */
export const ReviewQuestion = ({ item, sessionId, api, canRequestScoring, onResultChange }: ReviewQuestionProps): ReactElement => {
  const { t } = useTranslation();
  const skill = skillKey(item.section);
  const meta = [
    { label: t("review.metaQuestion"), value: String(item.orderIndex + 1) },
    { label: t("review.metaTask"), value: item.taskCode.replaceAll("_", " ") },
    { label: t("review.metaSkill"), value: skill ? t(skill) : item.section },
    { label: t("review.metaCefr"), value: item.cefrLevel ?? t("review.metaCefrNone") },
  ];
  const hasScore = item.score !== null && Number.isFinite(item.score);

  return (
    <div className="review-panels">
      <section className="review-panel review-panel-answer" aria-label={t("review.answerPanelTitle")}>
        <header className="review-panel-head"><span className="review-panel-dot" />{t("review.answerPanelTitle")}
          <RubricCriteriaButton api={api} taskType={item.taskCode} /></header>
        <dl className="review-meta">
          {meta.map((entry) => <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.value}</dd></div>)}
        </dl>
        <ReviewAnswerPane item={item} api={api} />
      </section>
      <section className="review-panel review-panel-result" aria-label={t("review.resultPanelTitle")}>
        <header className="review-panel-head">
          <span className="review-panel-dot" />{t("review.resultPanelTitle")}
          {hasScore ? <span className={`score-badge score-badge-${scoreTone(item.score)}`}>{formatScore(item.score)}</span> : null}
        </header>
        {item.status === "ANSWERED"
          ? <ScoreView api={api} sessionId={sessionId} itemId={item.publicId} initial={item.result} compact
            canRequestScoring={canRequestScoring} onResultChange={onResultChange} />
          : <p className="review-answer-empty">{t("score.answerNotSubmitted")}</p>}
      </section>
    </div>
  );
};
