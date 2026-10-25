"use client";

import { useState } from "react";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeTimingMode } from "../contracts";
import { preferenceKey, type ModeTarget } from "./mode-target";
import {
  ALL_QUESTIONS_COUNT, QUESTION_COUNT_OPTIONS, readModePreference, type ModePreference, type QuestionCountOption,
} from "./mode-preference";

interface PracticeModeDialogProps {
  /** The task type or skill the student picked; the dialog is closed when null. */
  target: ModeTarget | null;
  onClose: () => void;
  onStart: (target: ModeTarget, preference: ModePreference) => void;
}

/** Chooses timed or untimed practice and how many questions, before a session is created. */
export function PracticeModeDialog({ target, onClose, onStart }: PracticeModeDialogProps) {
  // Remount per target so the remembered choice for it is the starting point, with no effect to sync it.
  return target ? <ModeChoice key={preferenceKey(target)} target={target} onClose={onClose} onStart={onStart} /> : null;
}

function ModeChoice({ target, onClose, onStart }: Omit<PracticeModeDialogProps, "target"> & { target: ModeTarget }) {
  const { t } = useTranslation();
  const initial = readModePreference(preferenceKey(target));
  // Only a mock test is chosen timed or untimed; task and skill practice is always untimed, and a mock has a fixed length.
  const isMock = target.kind === "mock";
  const [timingMode, setTimingMode] = useState<PracticeTimingMode>(
    isMock && target.timedAvailable ? initial.timingMode : "UNTIMED");
  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(initial.questionCount);

  return (
    <Modal open onClose={onClose} title={target.title} titleIcon={<AppIcon name="practice" size={22} />}
      closeLabel={t("mode.close")}
      footer={(
        <>
          <button className="text-button" type="button" onClick={onClose}>{t("mode.close")}</button>
          <button className="button button-primary button-pill" type="button"
            onClick={() => onStart(target, { timingMode, questionCount })}>{t("mode.start")}</button>
        </>
      )}>
      {isMock ? (
        <div className="mode-options" role="radiogroup" aria-label={t("mode.modeLabel")}>
          <ModeOption selected={timingMode === "TIMED"} disabled={!target.timedAvailable} icon="timer"
            title={t("mode.timedTitle")} description={target.timedAvailable ? t("mode.timedDescription") : t("mode.timedUnavailable")}
            onSelect={() => setTimingMode("TIMED")} />
          <ModeOption selected={timingMode === "UNTIMED"} icon="play" title={t("mode.untimedTitle")}
            description={t("mode.untimedDescription")} onSelect={() => setTimingMode("UNTIMED")} />
        </div>
      ) : null}
      {isMock ? null : <div className="mode-count" role="radiogroup" aria-label={t("mode.questionCountLabel")}>
        <span className="mode-count-label">{t("mode.questionCountLabel")}</span>
        {QUESTION_COUNT_OPTIONS.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={questionCount === option}
            className={`mode-count-chip${questionCount === option ? " mode-count-chip-selected" : ""}`}
            onClick={() => setQuestionCount(option)}>
            {option === ALL_QUESTIONS_COUNT ? t("mode.questionCountAll") : option}
          </button>
        ))}
      </div>}
    </Modal>
  );
}

interface ModeOptionProps {
  selected: boolean;
  disabled?: boolean;
  icon: "timer" | "play";
  title: string;
  description: string;
  onSelect: () => void;
}

function ModeOption({ selected, disabled = false, icon, title, description, onSelect }: ModeOptionProps) {
  return (
    <button type="button" role="radio" aria-checked={selected} aria-disabled={disabled} disabled={disabled}
      className={`mode-option${selected ? " mode-option-selected" : ""}`} onClick={onSelect}>
      <span className="mode-option-title"><AppIcon name={icon} size={18} />{title}</span>
      <span className="mode-option-description">{description}</span>
    </button>
  );
}
