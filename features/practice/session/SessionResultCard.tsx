"use client";

import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeItemResult } from "../contracts";
import { ScoreView } from "../ScoreView";

/** The score of the item the learner just answered; shown until they continue. */
export interface AnsweredResult {
  itemPublicId: string;
  displayName: string;
  result: PracticeItemResult;
}

interface SessionResultCardProps {
  api: PracticeApiClient;
  sessionPublicId: string;
  answered: AnsweredResult;
  onContinue: () => void;
}

export function SessionResultCard({ api, sessionPublicId, answered, onContinue }: SessionResultCardProps) {
  const { t } = useTranslation();
  return (
    <section className="session-state-card score-card" data-testid="practice-session-result">
      <span className="eyebrow">{answered.displayName}</span>
      <h1>{t("score.title")}</h1>
      <ScoreView key={answered.itemPublicId} api={api} sessionId={sessionPublicId}
        itemId={answered.itemPublicId} initial={answered.result} />
      <div className="session-actions">
        <button className="button button-primary" type="button" onClick={onContinue}>{t("score.continue")}</button>
      </div>
    </section>
  );
}
