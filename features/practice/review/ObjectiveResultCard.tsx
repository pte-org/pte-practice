"use client";

import type { ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeOptionVerdict } from "../contracts";
import { ScoreDial } from "../ScoreDial";
import { hasBlankVerdicts } from "../renderers/blank-verdict";
import { OUTCOME_TEXT } from "../renderers/choice-verdict";
import { objectiveOutcome, tallyVerdicts } from "./objective-result";
import "./objective-result.css";

interface ObjectiveResultCardProps {
  score: number;
  /** Right and wrong per option, for a choice answer; empty for the other fixed-key answers. */
  verdicts: readonly PracticeOptionVerdict[];
  /** The text of every right option of a choice answer, shown as the answer key; empty when it is not known. */
  correctAnswers: readonly string[];
}

/** The result of an answer scored against a fixed key: a big score gauge, how it did, the picks, and the key. */
export const ObjectiveResultCard = ({ score, verdicts, correctAnswers }: ObjectiveResultCardProps): ReactElement => {
  const { t } = useTranslation();
  const outcome = objectiveOutcome(score, verdicts);
  const tally = tallyVerdicts(verdicts);
  const stats = [
    { key: "right", label: t("review.statRight"), value: tally.right },
    { key: "wrong", label: t("review.statWrong"), value: tally.wrong },
    // Every wrong gap already implies the word it missed, so a blanks answer does not count that twice.
    ...(hasBlankVerdicts(verdicts) ? [] : [{ key: "missed", label: t("review.statMissed"), value: tally.missed }]),
  ];

  return (
    <div className="objective-result" data-testid="objective-result">
      <div className="objective-result-gauge">
        <ScoreDial score={score} />
        <span className={`objective-result-chip objective-result-chip-${outcome}`}>{t(OUTCOME_TEXT[outcome])}</span>
      </div>
      {verdicts.length > 0 ? (
        <dl className="objective-result-stats">
          {stats.map((stat) => (
            <div key={stat.key} className={`objective-stat objective-stat-${stat.key}`}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {correctAnswers.length > 0 ? (
        <section className="objective-key">
          <h4>{t("review.correctAnswers")}</h4>
          <ul>{correctAnswers.map((answer) => <li key={answer}>{answer}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
};
