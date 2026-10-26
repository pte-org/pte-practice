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
        <button className="button button-outline-danger button-pill" type="button" disabled={props.pauseDisabled} onClick={props.onPause}>
          {props.pauseLabel}
        </button>
      </div>
      <SegmentedProgress segments={parts.segments} label={t("ui.sessionProgress")} />
    </header>
  );
}

interface SessionFooterProps {
  busy: boolean;
  showPrev?: boolean;
  prevDisabled?: boolean;
  prevLabel?: string;
  onPrev?: () => void;
  showSkip?: boolean;
  skipDisabled?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  showSubmit?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  showNext?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  onNext?: () => void;
}

/**
 * Bottom action bar:
 * - When !hasAnswer: [ ← Trước ] (if history) + [ Bỏ qua ⏭ ]
 * - When hasAnswer: [ ← Trước ] (if history) + [ Nộp câu trả lời ]
 * - When scoring: [ ← Trước ] (if history), Next hidden
 * - When scored / viewing history: [ ← Trước ] + [ Tiếp theo › ]
 */
export function SessionFooter({
  busy,
  showPrev = false,
  prevDisabled = false,
  prevLabel,
  onPrev,
  showSkip = false,
  skipDisabled = false,
  skipLabel,
  onSkip,
  showSubmit = false,
  submitDisabled = false,
  submitLabel,
  onSubmit,
  showNext = false,
  nextDisabled = false,
  nextLabel,
  onNext,
}: SessionFooterProps) {
  const { t } = useTranslation();
  return (
    <footer className="session-footer">
      {showSubmit && onSubmit ? (
        <div className="session-footer-center">
          <button
            className="session-btn-primary"
            type="button"
            disabled={busy || submitDisabled}
            aria-busy={busy}
            onClick={onSubmit}
          >
            <span>{submitLabel ?? t("session.submitAnswer")}</span>
          </button>
        </div>
      ) : null}

      <div className="session-footer-nav">
        {showPrev && onPrev ? (
          <button
            className="session-btn-outline"
            type="button"
            disabled={busy || prevDisabled}
            onClick={onPrev}
          >
            <AppIcon name="arrowLeft" size={18} />
            <span>{prevLabel ?? t("session.previous")}</span>
          </button>
        ) : null}

        {showSkip && onSkip ? (
          <button
            className="session-btn-outline"
            type="button"
            disabled={busy || skipDisabled}
            onClick={onSkip}
          >
            <span>{skipLabel ?? t("session.skip")}</span>
            <AppIcon name="skipNext" size={18} />
          </button>
        ) : null}

        {showNext && onNext ? (
          <button
            className="session-btn-outline"
            type="button"
            disabled={busy || nextDisabled}
            aria-busy={busy}
            onClick={onNext}
          >
            <span>{nextLabel ?? t("session.next")}</span>
            <AppIcon name="chevronRight" size={18} />
          </button>
        ) : null}
      </div>
    </footer>
  );
}
