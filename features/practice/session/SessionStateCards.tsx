"use client";

import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { UI_TEXT } from "../constants";
import type { PracticeSession } from "../contracts";

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
        <button className="button button-primary" type="button" onClick={onRetry}>
          {hasRetryAction ? t("ui.sessionRetryAction") : t("common.tryAgain")}
        </button>
        <button className="text-button" type="button" onClick={onBackHome}>{t("ui.backHome")}</button>
      </div>
    </section>
  );
}

export function SessionExitedCard({ session, onBackHome }: { session: PracticeSession | null; onBackHome: () => void }) {
  const { t } = useTranslation();
  const expired = session?.status === "EXPIRED";
  const discarded = session?.status === "DISCARDED";
  return (
    <section className="session-state-card" data-testid="practice-session-exited">
      <AppIcon name="check" size={28} />
      <h1>{expired ? t("ui.sessionExpired") : discarded ? t("ui.sessionNoProgressSaved") : t("ui.sessionProgressSaved")}</h1>
      <p>{expired ? t("ui.sessionExpired") : discarded ? t("ui.sessionCanStartNew") : t("ui.sessionDraftAvailable")}</p>
      <button className="button button-primary" type="button" onClick={onBackHome}>{t("ui.backHome")}</button>
    </section>
  );
}

interface SessionCompleteCardProps {
  session: PracticeSession;
  onReview: () => void;
  onBackHome: () => void;
}

export function SessionCompleteCard({ session, onReview, onBackHome }: SessionCompleteCardProps) {
  const { t } = useTranslation();
  const summary = t("ui.sessionAnsweredTasks")
    .replace("{answered}", session.answeredItemCount.toString())
    .replace("{total}", session.totalItemCount.toString());
  return (
    <section className="session-state-card" data-testid="practice-session-complete">
      <AppIcon name="check" size={28} />
      <h1>{t("ui.sessionCompleted")}</h1>
      <p>{summary}</p>
      <div className="session-actions">
        <button className="button button-primary" type="button" onClick={onReview}>{UI_TEXT.reviewTitle}</button>
        <button className="text-button" type="button" onClick={onBackHome}>{t("ui.backHome")}</button>
      </div>
    </section>
  );
}

