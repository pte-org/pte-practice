"use client";

import { useState } from "react";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeTimingMode } from "../contracts";
import { preferenceKey, type ModeTarget } from "./mode-target";
import { readModePreference, type ModePreference } from "./mode-preference";

interface PracticeModeDialogProps {
  /** The target mock test; the dialog is closed when null or not a mock. */
  target: ModeTarget | null;
  onClose: () => void;
  onStart: (target: ModeTarget, preference: ModePreference) => void;
}

/** Chooses timed or untimed practice for a mock test before a session is created. */
export function PracticeModeDialog({ target, onClose, onStart }: PracticeModeDialogProps) {
  if (!target || target.kind !== "mock") return null;
  return <ModeChoice key={preferenceKey(target)} target={target} onClose={onClose} onStart={onStart} />;
}

function ModeChoice({ target, onClose, onStart }: Omit<PracticeModeDialogProps, "target"> & { target: ModeTarget }) {
  const { t } = useTranslation();
  const initial = readModePreference(preferenceKey(target));
  const [timingMode, setTimingMode] = useState<PracticeTimingMode>(
    target.timedAvailable ? initial.timingMode : "UNTIMED");

  return (
    <Modal open onClose={onClose} title={target.title} titleIcon={<AppIcon name="practice" size={22} />}
      closeLabel={t("mode.close")}
      footer={(
        <>
          <button className="button button-pill button-outline-danger" type="button" onClick={onClose}>
            {t("mode.close")}
          </button>
          <button className="button button-primary button-pill" type="button"
            onClick={() => onStart(target, { timingMode, questionCount: initial.questionCount })}>{t("mode.start")}</button>
        </>
      )}>
      <div className="mode-options" role="radiogroup" aria-label={t("mode.modeLabel")}>
        <ModeOption selected={timingMode === "TIMED"} disabled={!target.timedAvailable} icon="timer"
          title={t("mode.timedTitle")} description={target.timedAvailable ? t("mode.timedDescription") : t("mode.timedUnavailable")}
          onSelect={() => setTimingMode("TIMED")} />
        <ModeOption selected={timingMode === "UNTIMED"} icon="play" title={t("mode.untimedTitle")}
          description={t("mode.untimedDescription")} onSelect={() => setTimingMode("UNTIMED")} />
      </div>
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
