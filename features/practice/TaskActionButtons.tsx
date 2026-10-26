"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeCatalogTask } from "./contracts";
import { iconForTaskType } from "./icon-mapping";
import { formatScore, skillIconName, skillShortName, taskDisplayName } from "./presentation";
import { getTaskBriefing } from "./task-briefing";

export interface TaskActionButtonsProps {
  task: PracticeCatalogTask;
  activeSession?: {
    sessionPublicId: string;
    answeredItemCount?: number;
    totalItemCount?: number;
  } | null;
  completedSession?: {
    sessionPublicId: string;
    answeredItemCount?: number;
    totalItemCount?: number;
    score?: number | null;
  } | null;
  canStart: boolean;
  onStart: (task: PracticeCatalogTask) => void;
  className?: string;
}

/**
 * Reusable action button for practice tasks.
 * Displays a single clean chevron right (>) button on the row.
 * Clicking opens a modern, Duolingo-style task briefing and session launcher modal.
 */
export const TaskActionButtons = forwardRef<HTMLButtonElement, TaskActionButtonsProps>(
  function TaskActionButtons(
    {
      task,
      activeSession,
      completedSession,
      canStart,
      onStart,
      className,
    },
    ref
  ) {
    const { t, locale } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const handleActionClick = () => {
      if (!canStart) return;
      setShowModal(true);
    };

    const isCompleted = !activeSession && (Boolean(completedSession) || task.answeredQuestionCount > 0);
    const briefing = getTaskBriefing(task.code);

    const answered = activeSession?.answeredItemCount ?? 0;
    const total = activeSession?.totalItemCount ?? 0;
    const completedScore = completedSession?.score ?? task.averageScore;

    // Stat 2: Progress / Latest Score / Answers
    let statLabel = t("progress.statAnswers");
    let statValue = "0";
    if (activeSession) {
      statLabel = t("progress.statProgress");
      statValue = `${answered}/${total}`;
    } else if (isCompleted) {
      if (completedScore !== null && Number.isFinite(completedScore)) {
        statLabel = t("progress.statScore");
        statValue = formatScore(completedScore);
      } else {
        statLabel = t("progress.statAnswers");
        statValue = `${task.answeredQuestionCount || completedSession?.answeredItemCount || 10}`;
      }
    }

    return (
      <div className={`skill-task-actions ${className ?? ""}`.trim()}>
        <button
          ref={ref}
          className="task-chevron-btn"
          type="button"
          disabled={!canStart}
          onClick={handleActionClick}
          aria-label={t("progress.practise")}
          title={t("progress.practise")}
        >
          <AppIcon name="chevronRight" size={20} />
        </button>

        {showModal ? (
          <Modal
            open={showModal}
            onClose={() => setShowModal(false)}
            title={taskDisplayName(task.code, task.displayName, t)}
            closeLabel={t("mode.close")}
            size="sm"
            className="pte-session-modal"
          >
            {/* Header: Centered task icon, title, and 1-line subtitle */}
            <div className="pte-modal-top">
              <div className="pte-modal-icon-badge" aria-hidden="true">
                <AppIcon name={iconForTaskType(task.code)} size={28} />
              </div>
              <h2 className="pte-modal-title">{taskDisplayName(task.code, task.displayName, t)}</h2>
              <p className="pte-modal-subtitle">
                {locale === "vi" ? briefing.summaryVi : briefing.summaryEn}
              </p>
            </div>

            {/* Quick Stat Cards: Skill and Answers / Progress */}
            <div className="pte-stats-row">
              <div className="pte-stat-card">
                <span className="pte-stat-icon">
                  <AppIcon name={skillIconName(task.section)} size={20} />
                </span>
                <span className="pte-stat-label">{t("progress.statSkill")}</span>
                <strong className="pte-stat-value">{skillShortName(task.section, locale)}</strong>
              </div>
              <div className="pte-stat-card">
                <span className="pte-stat-icon">
                  <AppIcon name={isCompleted && completedScore !== null ? "star" : "responses"} size={20} />
                </span>
                <span className="pte-stat-label">{statLabel}</span>
                <strong className="pte-stat-value">{statValue}</strong>
              </div>
            </div>

            {/* Section: Recommended for you */}
            <h3 className="pte-section-label">{t("progress.recommendedForYou")}</h3>

            {/* Recommended Featured Card */}
            {activeSession ? (
              <Link
                className="pte-featured-card"
                href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${activeSession.sessionPublicId}`}
                onClick={() => setShowModal(false)}
              >
                <span className="pte-featured-icon">
                  <AppIcon name="play" size={20} />
                </span>
                <div className="pte-featured-copy">
                  <strong className="pte-featured-title">{t("progress.resumeOptionTitle")}</strong>
                  <p className="pte-featured-subtitle">
                    {t("progress.resumeOptionDescription")}
                  </p>
                </div>
                <div className="pte-featured-badges">
                  <span className="pte-featured-chip">
                    <AppIcon name="timer" size={14} />
                    {locale === "vi" ? briefing.durationVi : briefing.durationEn}
                  </span>
                </div>
              </Link>
            ) : (
              <div
                className="pte-featured-card"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setShowModal(false);
                  onStart(task);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setShowModal(false);
                    onStart(task);
                  }
                }}
              >
                <span className="pte-featured-icon">
                  <AppIcon name={isCompleted ? "retake" : "bookOpen"} size={20} />
                </span>
                <div className="pte-featured-copy">
                  <strong className="pte-featured-title">
                    {isCompleted ? t("progress.newOptionTitle") : t("progress.quickPracticeTitle")}
                  </strong>
                  <p className="pte-featured-subtitle">
                    {isCompleted ? t("progress.newOptionDescription") : t("progress.quickPracticeSubtitle")}
                  </p>
                </div>
                <div className="pte-featured-badges">
                  <span className="pte-featured-chip">
                    <AppIcon name="bookOpen" size={14} />
                    {locale === "vi" ? briefing.formatVi : briefing.formatEn}
                  </span>
                  <span className="pte-featured-chip">
                    <AppIcon name="timer" size={14} />
                    {locale === "vi" ? briefing.durationVi : briefing.durationEn}
                  </span>
                </div>
              </div>
            )}

            {/* If completed, optional Review previous session card */}
            {isCompleted ? (
              <Link
                className="pte-secondary-card"
                href={
                  completedSession?.sessionPublicId
                    ? `${PRACTICE_ROUTES.practiceReview}?sessionId=${completedSession.sessionPublicId}`
                    : PRACTICE_ROUTES.progress
                }
                onClick={() => setShowModal(false)}
              >
                <span className="pte-secondary-icon">
                  <AppIcon name="responses" size={20} />
                </span>
                <div className="pte-secondary-copy">
                  <strong className="pte-secondary-title">{t("progress.reviewSessionAction")}</strong>
                  <p className="pte-secondary-subtitle">{t("progress.reviewSessionSubtitle")}</p>
                </div>
                <AppIcon name="chevronRight" size={18} className="pte-secondary-arrow" />
              </Link>
            ) : null}

            {/* Practical Study Tip Box */}
            <div className="pte-tip-box">
              <span className="pte-tip-icon">
                <AppIcon name="info" size={18} />
              </span>
              <p className="pte-tip-text">{locale === "vi" ? briefing.tipVi : briefing.tipEn}</p>
            </div>

            {/* Bottom Primary CTA */}
            {activeSession ? (
              <>
                <Link
                  className="pte-primary-cta"
                  href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${activeSession.sessionPublicId}`}
                  onClick={() => setShowModal(false)}
                >
                  <AppIcon name="play" size={18} />
                  <span>{t("progress.resumeSessionAction")}</span>
                </Link>
                <button
                  type="button"
                  className="pte-alt-link"
                  onClick={() => {
                    setShowModal(false);
                    onStart(task);
                  }}
                >
                  {t("progress.startFreshLink")}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pte-primary-cta"
                onClick={() => {
                  setShowModal(false);
                  onStart(task);
                }}
              >
                <AppIcon name="play" size={18} />
                <span>{isCompleted ? t("progress.startNewSetAction") : t("progress.startSessionAction")}</span>
              </button>
            )}
          </Modal>
        ) : null}
      </div>
    );
  }
);
