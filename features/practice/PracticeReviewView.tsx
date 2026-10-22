"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/common/components";
import { PRACTICE_ROUTES, UI_TEXT } from "./constants";
import { createPracticeApiClient, PracticeApiError } from "./api";
import type { PracticeExplanation, PracticeReview, PracticeReviewItem } from "./contracts";

export function PracticeReviewView() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("sessionId");
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void createPracticeApiClient().getReview(sessionId).then(setReview).catch((reason: unknown) => {
      setError(reason instanceof PracticeApiError ? reason.message : UI_TEXT.reviewLoadError);
    });
  }, [sessionId]);

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
        {review.items.map((item) => <ReviewItem key={item.publicId} item={item} sessionId={sessionId} />)}
      </div>
    </section>
  );
}

function ReviewItem({ item, sessionId }: { item: PracticeReviewItem; sessionId: string }) {
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [explanation, setExplanation] = useState<PracticeExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const api = useMemo(() => createPracticeApiClient(), []);
  const answer = parseAnswer(item.savedPayload);

  const pollExplanation = async (requestedLanguage: "vi" | "en") => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      try {
        const result = await api.getExplanation(sessionId, item.publicId, requestedLanguage);
        setExplanation(result);
        if (result.status === "AVAILABLE" || result.status === "FAILED" || result.status === "UNAVAILABLE"
          || result.status === "CANCELLED") {
          setMessage(result.status === "AVAILABLE" ? null : result.status === "UNAVAILABLE"
            ? UI_TEXT.explanationUnavailable : UI_TEXT.explanationFailed);
          return;
        }
      } catch {
        setMessage(UI_TEXT.explanationFailed);
        return;
      }
    }
  };

  const explain = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.requestExplanation(sessionId, item.publicId, language);
      setExplanation(result);
      if (result.status === "UNAVAILABLE") setMessage(UI_TEXT.explanationUnavailable);
      if (result.status === "FAILED") setMessage(UI_TEXT.explanationFailed);
      if (result.status === "QUEUED" || result.status === "RUNNING" || result.status === "RETRY_WAIT"
        || result.status === "WAITING_EVIDENCE") {
        setMessage(UI_TEXT.explanationQueued);
        void pollExplanation(result.language);
      }
    } catch (reason) {
      setMessage(reason instanceof PracticeApiError ? reason.message : UI_TEXT.explanationFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="review-card">
      <div className="review-card-heading"><div><span className="eyebrow">{item.section}</span><h2>{item.displayName}</h2></div>
        <span className="state-badge state-badge-ready">{item.status}</span></div>
      {item.promptText ? <p className="review-prompt">{item.promptText}</p> : null}
      <pre className="review-answer">{answer}</pre>
      {item.status === "ANSWERED" ? <>
        <div className="review-actions"><label>{UI_TEXT.explanationLanguage}
          <select value={language} onChange={(event) => setLanguage(event.target.value as "vi" | "en")}>
            <option value="vi">{UI_TEXT.explanationVietnamese}</option><option value="en">{UI_TEXT.explanationEnglish}</option>
          </select></label><button className="button button-primary" type="button" onClick={() => void explain()} disabled={loading}>
            {loading ? UI_TEXT.explanationLoading : UI_TEXT.explanationAction}</button></div>
        {message ? <p className="inline-notice" role="status">{message}</p> : null}
        {explanation?.status === "AVAILABLE" ? <ExplanationBody explanation={explanation} /> : null}
      </> : null}
    </article>
  );
}

function ExplanationBody({ explanation }: { explanation: PracticeExplanation }) {
  return <div className="review-explanation"><h3>{UI_TEXT.explanationTitle}</h3><p>{explanation.summary}</p>
    <div className="review-columns"><div><strong>{UI_TEXT.explanationStrengths}</strong><ul>{explanation.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div><strong>{UI_TEXT.explanationImprovements}</strong><ul>{explanation.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
    <div><strong>{UI_TEXT.explanationRubric}</strong>{explanation.rubricFeedback.map((item) => <div className="rubric-row" key={item.criterionId}>
      <span>{item.criterionId} · {item.level}</span><p>{item.feedback}</p><small>{item.evidence}</small></div>)}</div>
  </div>;
}

function parseAnswer(payload: string | null): string {
  if (!payload) return UI_TEXT.reviewSubmittedNoAnswer;
  try { return JSON.stringify(JSON.parse(payload), null, 2); } catch { return payload; }
}

function ReviewState({ message }: { message: string }) {
  return <section className="session-state-card"><h1>{UI_TEXT.reviewTitle}</h1><p>{message}</p></section>;
}
