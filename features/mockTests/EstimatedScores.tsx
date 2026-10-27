"use client";

import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import type { EstimatedScores as EstimatedScoresData } from "./mock-test-contracts";

const SKILLS = ["speaking", "writing", "reading", "listening"] as const;

/** Reference 10-90 estimate of a finished mock test; always labelled as unofficial. */
export function EstimatedScores({ scores }: { scores: EstimatedScoresData }) {
  const { t } = useTranslation();
  return (
    <section className="estimated-scores" aria-label={t("mockTests.estimateTitle")} data-testid="estimated-scores">
      <div className="estimated-overall">
        <span>{t("mockTests.estimateTitle")}</span>
        <strong>{scores.overall ?? "-"}</strong>
      </div>
      <ul className="estimated-skills">
        {SKILLS.map((skill) => (
          <li key={skill}>
            <span>{t(`skills.${skill}` as TranslationKey)}</span>
            <strong>{scores[skill] ?? "-"}</strong>
          </li>
        ))}
      </ul>
      <p className="estimated-note">{t("mockTests.estimateNote")}</p>
      {scores.pending ? <p className="estimated-note" role="status">{t("mockTests.estimatePending")}</p> : null}
      {scores.skippedItemCount > 0 ? <p className="estimated-note">{scores.skippedItemCount} {t("mockTests.estimateSkipped")}</p> : null}
      {scores.excludedItemCount > 0 ? <p className="estimated-note">{scores.excludedItemCount} {t("mockTests.estimateExcluded")}</p> : null}
    </section>
  );
}
