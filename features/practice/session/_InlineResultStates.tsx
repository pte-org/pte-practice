"use client";

import { AppIcon, LoadingState } from "@/common/components";
import { useTranslation } from "@/common/i18n";

/** Scoring took too long or the result requests kept failing: offer to check again. */
export function InlineResultTimeout({ onRecheck }: { onRecheck: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="inline-result-card inline-result-status-card" role="status" data-testid="inline-result-timeout">
      <div className="inline-result-status-inner">
        <AppIcon name="alert" size={22} className="inline-icon-alert" />
        <div className="inline-status-text">
          <p>{t("score.timeout")}</p>
          <button className="button button-outline button-pill inline-retry-btn" type="button" onClick={onRecheck}>
            {t("score.checkAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InlineResultScoring() {
  const { t } = useTranslation();
  return (
    <div className="inline-result-card inline-result-scoring" role="status" aria-live="polite" data-testid="inline-result-scoring">
      <LoadingState compact message={t("session.scoringInProgress")} />
      <small className="inline-scoring-hint">{t("score.scoringHint")}</small>
    </div>
  );
}

interface InlineResultFailedProps {
  retryable: boolean;
  retrying: boolean;
  retryError: string | null;
  onRetry: () => void;
}

export function InlineResultFailed({ retryable, retrying, retryError, onRetry }: InlineResultFailedProps) {
  const { t } = useTranslation();
  return (
    <div className="inline-result-card inline-result-status-card" role="alert" data-testid="inline-result-failed">
      <div className="inline-result-status-inner">
        <AppIcon name="alert" size={22} className="inline-icon-alert" />
        <div className="inline-status-text">
          <p>{t("score.failed")}</p>
          {retryable ? (
            <button className="button button-outline button-pill inline-retry-btn" type="button" disabled={retrying}
              onClick={onRetry}>
              {retrying ? t("score.retrying") : t("score.retry")}
            </button>
          ) : (
            <small className="inline-status-subtext">{t("score.retryLimit")}</small>
          )}
          {retryError ? <p className="inline-error-msg">{retryError}</p> : null}
        </div>
      </div>
    </div>
  );
}
