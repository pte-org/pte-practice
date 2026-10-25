"use client";

import { AppIcon, SegmentedProgress } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { SessionParts } from "./session-chrome";

interface SessionHeaderProps {
  title: string;
  /** The skill of the current question, under the title. */
  subtitle: string;
  parts: SessionParts;
  questionNumber: number;
  questionCount: number;
  /** Disabled while a command runs or a recording is being saved. */
  pauseDisabled: boolean;
  pauseLabel: string;
  onPause: () => void;
}

/** Top of the session page, as in the Pearson practice session: title, part and question, "Pause session". */
export function SessionHeader(props: SessionHeaderProps) {
  const { t } = useTranslation();
  const { parts } = props;
  return (
    <header className="session-header">
      <div className="session-header-bar">
        <div className="session-header-title">
          <h1>{props.title}</h1>
          <span>{props.subtitle}</span>
        </div>
        <div className="session-header-meta">
          <span>{t("session.part").replace("{n}", String(parts.partNumber)).replace("{total}", String(parts.partCount))}</span>
          <strong>{t("session.question").replace("{n}", String(props.questionNumber)).replace("{total}", String(props.questionCount))}</strong>
        </div>
        <button className="button button-outline button-pill" type="button" disabled={props.pauseDisabled} onClick={props.onPause}>
          {props.pauseLabel}
        </button>
      </div>
      <SegmentedProgress segments={parts.segments} label={t("ui.sessionProgress")} />
    </header>
  );
}

interface SessionFooterProps {
  busy: boolean;
  nextDisabled: boolean;
  nextLabel: string;
  onSkip: () => void;
  onNext: () => void;
}

/** Bottom bar: "Skip" on the left, "Next ›" (submits the answer) on the right. */
export function SessionFooter({ busy, nextDisabled, nextLabel, onSkip, onNext }: SessionFooterProps) {
  const { t } = useTranslation();
  return (
    <footer className="session-footer">
      <button className="text-button" type="button" disabled={busy} onClick={onSkip}>{t("session.skip")}</button>
      <button className="button button-outline button-pill" type="button" disabled={nextDisabled} aria-busy={busy} onClick={onNext}>
        {nextLabel} <AppIcon name="chevronRight" size={18} />
      </button>
    </footer>
  );
}
