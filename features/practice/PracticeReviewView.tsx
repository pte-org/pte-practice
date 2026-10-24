"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES, UI_TEXT } from "./constants";
import { createPracticeApiClient, PracticeApiError, type PracticeApiClient } from "./api";
import type { PracticeReview, PracticeReviewItem } from "./contracts";
import { describeSavedAnswer } from "./review-answer";
import { ScoreView } from "./ScoreView";

export function PracticeReviewView() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId");
  const api = useMemo(() => createPracticeApiClient(), []);
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void api.getReview(sessionId).then(setReview).catch((reason: unknown) => {
      setError(reason instanceof PracticeApiError ? reason.message : UI_TEXT.reviewLoadError);
    });
  }, [api, sessionId]);

  if (!sessionId) return <ReviewState message={UI_TEXT.reviewRequiredSession} />;
  if (error) return <ReviewState message={error} />;
  if (!review) return <LoadingState message={UI_TEXT.reviewLoading} />;

  return (
    <section className="page-stack practice-review" data-testid="practice-review">
      <div className="page-heading">
        <div><span className="eyebrow">{UI_TEXT.reviewEyebrow}</span><h1>{UI_TEXT.reviewTitle}</h1>
          <p>{UI_TEXT.reviewDescription}</p></div>
        <button className="text-button" type="button" onClick={() => router.push(PRACTICE_ROUTES.practiceSession + `?sessionId=${sessionId}`)}>
          {UI_TEXT.reviewBack}
        </button>
      </div>
      <div className="review-list">
        {review.items.map((item) => <ReviewItem key={item.publicId} item={item} sessionId={sessionId} api={api} />)}
      </div>
    </section>
  );
}

function ReviewItem({ item, sessionId, api }: { item: PracticeReviewItem; sessionId: string; api: PracticeApiClient }) {
  return (
    <article className="review-card">
      <div className="review-card-heading"><div><span className="eyebrow">{item.section}</span><h2>{item.displayName}</h2></div>
        <span className="state-badge state-badge-ready">{item.status}</span></div>
      {item.promptText ? <p className="review-prompt">{item.promptText}</p> : null}
      <SavedAnswerView item={item} />
      {item.status === "ANSWERED"
        ? <ScoreView api={api} sessionId={sessionId} itemId={item.publicId} initial={null} compact /> : null}
    </article>
  );
}

function SavedAnswerView({ item }: { item: PracticeReviewItem }) {
  const { t } = useTranslation();
  const answer = describeSavedAnswer(item.savedPayload, item.promptText, item.options);
  switch (answer.kind) {
    case "empty":
      return <p className="review-answer review-answer-empty">{t("score.answerNotSubmitted")}</p>;
    case "audio":
      return (
        <p className="review-answer review-answer-text">
          {t("score.answerRecorded")}{answer.seconds != null ? ` · ${answer.seconds} ${t("score.answerSeconds")}` : ""}
        </p>
      );
    case "text":
      return <p className="review-answer review-answer-text">{answer.text}</p>;
    case "entries":
      return (
        <ol className="review-answer review-answer-list">
          {answer.entries.map((entry, index) => (
            <li key={index}>{entry.label ? <strong>{entry.label}. </strong> : null}{entry.value || "—"}</li>
          ))}
        </ol>
      );
    default:
      return <pre className="review-answer">{answer.text}</pre>;
  }
}

function ReviewState({ message }: { message: string }) {
  return <section className="session-state-card"><h1>{UI_TEXT.reviewTitle}</h1><p>{message}</p></section>;
}
