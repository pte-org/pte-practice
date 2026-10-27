"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CollapsibleSection, LoadingState } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import { formatScore, itemStatusKey, scoreTone, skillKey } from "./presentation";
import { createPracticeApiClient, PracticeApiError, type PracticeApiClient } from "./api";
import type { PracticeReview, PracticeReviewItem } from "./contracts";
import { describeSavedAnswer } from "./review-answer";
import { EstimatedScores } from "../mockTests/EstimatedScores";
import { ScoreView } from "./ScoreView";

export function PracticeReviewView() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const sessionId = params.get("sessionId");
  const api = useMemo(() => createPracticeApiClient(), []);
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void api.getReview(sessionId).then(setReview).catch((reason: unknown) => {
      setError(reason instanceof PracticeApiError ? reason.message : t("review.loadError"));
    });
  }, [api, sessionId, t]);

  if (!sessionId) return <ReviewState message={t("review.requiredSession")} />;
  if (error) return <ReviewState message={error} />;
  if (!review) return <LoadingState message={t("review.loading")} />;

  return (
    <section className="page-column practice-review" data-testid="practice-review">
      <div className="page-heading">
        <div><span className="eyebrow">{t("review.eyebrow")}</span><h1>{t("review.title")}</h1>
          <p>{t("review.description")}</p></div>
        <button className="button button-outline button-pill" type="button" onClick={() => router.push(PRACTICE_ROUTES.home)}>
          {t("review.back")}
        </button>
      </div>
      {review.estimatedScores ? <EstimatedScores scores={review.estimatedScores} /> : null}
      <div className="review-list">
        {review.items.map((item, index) => (
          <ReviewItem key={item.publicId} item={item} sessionId={sessionId} api={api} defaultExpanded={index === 0} />
        ))}
      </div>
    </section>
  );
}

/** One question, collapsed to its name, status and score; opening it shows the answer and the scoring detail. */
function ReviewItem({
  item,
  sessionId,
  api,
  defaultExpanded = false,
}: {
  item: PracticeReviewItem;
  sessionId: string;
  api: PracticeApiClient;
  defaultExpanded?: boolean;
}) {
  const { t } = useTranslation();
  const skill = skillKey(item.section);
  return (
    <article className="card review-card">
      <CollapsibleSection title={`${item.orderIndex + 1}. ${item.displayName}`} defaultExpanded={defaultExpanded}
        subtitle={`${skill ? t(skill) : item.section} · ${t(itemStatusKey(item.status))}`}
        actions={<span className={`score-badge score-badge-${scoreTone(item.score)}`}>{formatScore(item.score)}</span>}>
        {item.promptText ? <p className="review-prompt">{item.promptText}</p> : null}
        <SavedAnswerView item={item} />
        {item.status === "ANSWERED"
          ? <ScoreView api={api} sessionId={sessionId} itemId={item.publicId} initial={null} compact /> : null}
      </CollapsibleSection>
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
  const { t } = useTranslation();
  return <section className="session-state-card"><h1>{t("review.title")}</h1><p>{message}</p></section>;
}
