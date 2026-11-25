"use client";

import type { ReactElement } from "react";
import { ScoreGauge } from "@/common/components";
import { useCountUp } from "@/common/hooks/useCountUp";
import { useTranslation } from "@/common/i18n";
import { SCORE_TONE_THRESHOLDS } from "./constants";
import "./score-dial.css";

interface ScoreDialProps {
  /** The score out of 100. */
  score: number;
}

const LIMITS = { low: SCORE_TONE_THRESHOLDS.LOW, high: SCORE_TONE_THRESHOLDS.HIGH };

/** A score as a gauge that runs up from 0: the arc fills, the knob slides and the number counts up together. */
export const ScoreDial = ({ score }: ScoreDialProps): ReactElement => {
  const { t } = useTranslation();
  const drawn = useCountUp(score);
  return (
    <ScoreGauge label={t("score.title")} value={score} drawnValue={drawn} limits={LIMITS}>
      <span className="score-dial-label">{t("session.scoreLabel")}</span>
      <strong className="score-dial-value">{Math.round(drawn)}</strong>
      <span className="score-dial-max">{t("score.outOf")}</span>
    </ScoreGauge>
  );
};
