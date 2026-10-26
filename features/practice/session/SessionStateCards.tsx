"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeSession } from "../contracts";
import { formatScore, scoreTone } from "../presentation";
import { continueHref, sessionAverageScore } from "./complete-actions";

export function SessionLoading() {
  const { t } = useTranslation();
  return (
    <section className="session-state-card" role="status">
      <span className="loading-dot" /><p>{t("ui.sessionLoading")}</p>
    </section>
  );
}

interface SessionErrorCardProps {
  message: string | null;
  /** True when the failure came from a command that can be re-run, so the button says "retry that command". */
  hasRetryAction: boolean;
  onRetry: () => void;
  onBackHome: () => void;
}

export function SessionErrorCard({ message, hasRetryAction, onRetry, onBackHome }: SessionErrorCardProps) {
  const { t } = useTranslation();
  return (
    <section className="session-state-card" data-testid="practice-session-error">
      <AppIcon name="info" size={28} />
      <h1>{t("common.genericErrorTitle")}</h1>
      <p>{message ?? t("ui.sessionError")}</p>
      <div className="session-actions">
        <button className="button button-primary button-pill" type="button" onClick={onRetry}>
          {hasRetryAction ? t("ui.sessionRetryAction") : t("common.tryAgain")}
        </button>
        <button className="button button-outline-danger button-pill" type="button" onClick={onBackHome}>{t("ui.backHome")}</button>
      </div>
    </section>
  );
}

interface SessionCompleteCardProps {
  session: PracticeSession;
  api: PracticeApiClient;
  onReview: () => void;
  onBackHome: () => void;
}

/** End of a session: how many answered, the average score so far, and where to go next. */
export function SessionCompleteCard({ session, api, onReview, onBackHome }: SessionCompleteCardProps) {
  const { t } = useTranslation();
  const [average, setAverage] = useState<number | null>(null);
  const again = continueHref(session);

  useEffect(() => {
    let active = true;
    void api.getReview(session.publicId)
      .then((review) => { if (active) setAverage(sessionAverageScore(review.items.map((item) => item.score))); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [api, session.publicId]);

  return (
    <section className="session-state-card card" data-testid="practice-session-complete">
      <AppIcon name="check" size={32} />
      <h1>{t("review.completedTitle")}</h1>
      <p>{t("review.completedSummary").replace("{answered}", String(session.answeredItemCount))
        .replace("{total}", String(session.totalItemCount))}</p>
      <p className="complete-average">
        {t("review.averageScore")}: <span className={`score-badge score-badge-${scoreTone(average)}`}>{formatScore(average)}</span>
      </p>
      <div className="session-actions">
        <button className="button button-primary button-pill" type="button" onClick={onReview}>{t("review.reviewAnswers")}</button>
        {again ? <Link className="button button-outline button-pill" href={again}>{t("review.practiseAgain")}</Link> : null}
        <button className="button button-outline-danger button-pill" type="button" onClick={onBackHome}>{t("review.home")}</button>
      </div>
    </section>
  );
}
