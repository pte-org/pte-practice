"use client";

import type { ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeItemResult, PracticeReviewItem } from "../contracts";
import { formatScore, scoreTone, skillKey } from "../presentation";
import { ScoreView } from "../ScoreView";
import { ObjectiveResultCard } from "./ObjectiveResultCard";
import { isObjectiveTask } from "./objective-result";
import { ReviewAnswerPane } from "./ReviewAnswerPane";
import { correctOptionLabels, reviewChoiceView } from "./review-choice";
import { RubricCriteriaButton } from "./RubricCriteriaButton";

interface ReviewQuestionProps {
  item: PracticeReviewItem;
  sessionId: string;
  api: PracticeApiClient;
  canRequestScoring: boolean;
  onResultChange: (result: PracticeItemResult) => void;
}

/** One reviewed question as two separate panels: the question and answer on the left, its result on the right. */
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
  // A fixed-key answer is not an AI report: it gets a plain "Result" panel and no rubric criteria to browse.
  const objective = isObjectiveTask(item.taskCode);
  const scored = item.status === "ANSWERED" && item.result?.state === "SCORED" ? item.result : null;
  const objectiveScore = objective && scored ? scored.score : null;
  const resultTitle = t(objective ? "review.resultPanelObjective" : "review.resultPanelTitle");
  const choice = reviewChoiceView(item);

  return (
    <div className={`review-panels${objectiveScore !== null ? " review-panels-objective" : ""}`}>
      <section className="review-panel review-panel-answer" aria-label={t("review.answerPanelTitle")}>
        <header className="review-panel-head"><span className="review-panel-dot" />{t("review.answerPanelTitle")}
          {objective ? null : <RubricCriteriaButton api={api} taskType={item.taskCode} />}</header>
        <dl className="review-meta">
          {meta.map((entry) => <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.value}</dd></div>)}
        </dl>
        <ReviewAnswerPane item={item} api={api} />
      </section>
      <section className={`review-panel review-panel-result${objectiveScore !== null ? " review-panel-result-objective" : ""}`}
        aria-label={resultTitle}>
        <header className="review-panel-head">
          <span className="review-panel-dot" />{resultTitle}
          {hasScore && objectiveScore === null
            ? <span className={`score-badge score-badge-${scoreTone(item.score)}`}>{formatScore(item.score)}</span> : null}
        </header>
        {item.status !== "ANSWERED" ? <p className="review-answer-empty">{t("score.answerNotSubmitted")}</p>
          : objectiveScore !== null && scored ? (
            <ObjectiveResultCard score={objectiveScore} verdicts={scored.optionVerdicts ?? []}
              correctAnswers={choice ? correctOptionLabels(choice) : []} />
          ) : (
            <ScoreView api={api} sessionId={sessionId} itemId={item.publicId} initial={item.result} compact
              canRequestScoring={canRequestScoring} onResultChange={onResultChange} />
          )}
      </section>
    </div>
  );
};
