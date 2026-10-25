"use client";

import { forwardRef } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { ConfidenceHint } from "../ConfidenceHint";
import type { ResponseConfidence } from "../contracts";

const LEVELS: ReadonlyArray<{ level: ResponseConfidence; key: TranslationKey }> = [
  { level: "LOW", key: "ui.sessionConfidenceLow" },
  { level: "MEDIUM", key: "ui.sessionConfidenceMedium" },
  { level: "HIGH", key: "ui.sessionConfidenceHigh" },
];

interface ConfidencePanelProps {
  value: ResponseConfidence | null;
  disabled: boolean;
  missing: boolean;
  onChoose: (level: ResponseConfidence) => void;
}

export const ConfidencePanel = forwardRef<HTMLDivElement, ConfidencePanelProps>(
  function ConfidencePanel({ value, disabled, missing, onChoose }, ref) {
    const { t } = useTranslation();
    return (
      <div ref={ref} className={`confidence-panel${missing ? " field-missing" : ""}`}>
        <ConfidenceHint />
        <p>{t("ui.sessionConfidence")}</p>
        <div className="confidence-options" role="radiogroup">
          {LEVELS.map(({ level, key }) => (
            <button key={level} type="button" role="radio" aria-checked={value === level} disabled={disabled}
              className={`confidence-option confidence-${level.toLowerCase()}${value === level ? " confidence-selected" : ""}`}
              onClick={() => onChoose(level)}>{t(key)}</button>
          ))}
        </div>
        {missing ? <FieldWarning message={t("ui.sessionConfidenceRequired")} /> : null}
      </div>
    );
  },
);

export function FieldWarning({ message }: { message: string }) {
  return <p className="field-warning" role="alert"><AppIcon name="info" size={16} />{message}</p>;
}
