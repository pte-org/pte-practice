"use client";

import { AppIcon, LoadingState } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeReview } from "../contracts";
import { scoringCounts, useMockTestScoring } from "../useMockTestScoring";

interface MockTestScoringBarProps {
  api: PracticeApiClient;
  review: PracticeReview;
  onReview: (review: PracticeReview) => void;
}

/** Above a finished mock test's report: one "Chấm điểm" for every speaking and writing answer not scored yet. */
export function MockTestScoringBar({ api, review, onReview }: MockTestScoringBarProps) {
  const { t } = useTranslation();
  const { requesting, failed, scoreAll } = useMockTestScoring(api, review, onReview);
  const { unscored, scoring } = scoringCounts(review);
  if (unscored === 0 && scoring === 0) return null;
  if (scoring > 0 && unscored === 0) {
    return (
      <div className="mock-scoring-bar" role="status" aria-live="polite" data-testid="mock-scoring-progress">
        <LoadingState compact message={t("review.scoringAll").replace("{n}", String(scoring))} />
      </div>
    );
  }
  return (
    <div className="mock-scoring-bar" data-testid="mock-scoring-bar">
      <p>{t("review.scoreAllHint").replace("{n}", String(unscored))}</p>
      <button className="button button-primary button-pill" type="button" disabled={requesting} onClick={scoreAll}>
        <AppIcon name="sparkle" size={16} />
        {requesting ? t("score.requesting") : t("review.scoreAll")}
      </button>
      {failed ? <p className="inline-error-msg" role="alert">{t("review.scoreAllError")}</p> : null}
    </div>
  );
}
