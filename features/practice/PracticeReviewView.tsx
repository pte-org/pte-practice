"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { MOCK_TEST_KIND } from "./constants";
import { createPracticeApiClient, PracticeApiError } from "./api";
import type { PracticeItemResult, PracticeReview } from "./contracts";
import { ReviewPager, ReviewQuestionNav } from "./review/ReviewPager";
import { ReviewQuestion } from "./review/ReviewQuestion";
import { REVIEW_FROM_PARAM, reviewReturnTarget } from "./review-return";
import { EstimatedScores } from "../mockTests/EstimatedScores";
import { MockTestScoringBar } from "./feedback/MockTestScoringBar";
import "./review/review.css";

export function PracticeReviewView() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const sessionId = params.get("sessionId");
  const returnTarget = reviewReturnTarget(params.get(REVIEW_FROM_PARAM));
  const api = useMemo(() => createPracticeApiClient(), []);
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    void api.getReview(sessionId).then(setReview).catch((reason: unknown) => {
      setError(reason instanceof PracticeApiError ? reason.message : t("review.loadError"));
    });
  }, [api, sessionId, t]);

  // Keep each newer score in the loaded review: moving to another question and back must not show the old state.
  const updateResult = (itemId: string, result: PracticeItemResult): void => {
    setReview((previous) => previous && ({
      ...previous,
      items: previous.items.map((entry) => entry.publicId === itemId
        ? { ...entry, result, score: result.score ?? entry.score } : entry),
    }));
  };

  if (!sessionId) return <ReviewState message={t("review.requiredSession")} />;
  if (error) return <ReviewState message={error} />;
  if (!review) return <LoadingState message={t("review.loading")} />;
  const isMockTest = review.kind === MOCK_TEST_KIND;
  const current = review.items[Math.min(index, review.items.length - 1)];

  return (
    <section className="practice-review" data-testid="practice-review">
      <div className="page-heading">
        <div><h1>{t("review.title")}</h1>
          <p>{t("review.description")}</p></div>
        <button className="button button-outline button-pill" type="button" onClick={() => router.push(returnTarget.href)}>
          {t(returnTarget.label)}
        </button>
      </div>
      {isMockTest ? <MockTestScoringBar api={api} review={review} onReview={setReview} /> : null}
      {review.estimatedScores ? <EstimatedScores scores={review.estimatedScores} /> : null}
      {current ? (
        <>
          <ReviewQuestionNav items={review.items} index={index} onSelect={setIndex} />
          {/* A new scoring state remounts the score so it starts from the review's latest result. */}
          <ReviewQuestion key={current.publicId} item={current} sessionId={sessionId} api={api}
            canRequestScoring={!isMockTest} onResultChange={(result) => updateResult(current.publicId, result)} />
          <ReviewPager items={review.items} index={index} onSelect={setIndex} />
        </>
      ) : null}
    </section>
  );
}

function ReviewState({ message }: { message: string }) {
  const { t } = useTranslation();
  return <section className="session-state-card"><h1>{t("review.title")}</h1><p>{message}</p></section>;
}
