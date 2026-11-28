"use client";

import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";

interface ScoringRequestProps {
  /** False in a mock test, whose answers are scored together after it is submitted. */
  canRequest: boolean;
  requesting: boolean;
  /** True while the platform admin has AI practice scoring switched off: the button stays locked. */
  switchedOff?: boolean;
  error: string | null;
  onRequest: () => void;
}

/** An answered speaking or writing question nobody has asked to score yet. */
export function ScoringRequest({ canRequest, requesting, switchedOff = false, error, onRequest }: ScoringRequestProps) {
  const { t } = useTranslation();
  if (!canRequest) {
    return <div className="scoring-request" data-testid="scoring-request-later"><p>{t("score.mockScoredLater")}</p></div>;
  }
  return (
    <div className="scoring-request" data-testid="scoring-request">
      <p>{switchedOff ? t("score.scoringSwitchedOff") : t("score.requestHint")}</p>
      <button className="button button-primary button-pill" type="button" disabled={requesting || switchedOff}
        onClick={onRequest}>
        <AppIcon name="sparkle" size={16} />
        {requesting ? t("score.requesting") : t("score.requestScoring")}
      </button>
      {error ? <p className="inline-error-msg" role="alert">{t("score.requestError")}</p> : null}
    </div>
  );
}
