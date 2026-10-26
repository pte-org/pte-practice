"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeCatalogTask } from "./contracts";
import { iconForTaskType } from "./icon-mapping";
import { formatScore, scoreTone, skillKey, taskDisplayName } from "./presentation";
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
 * Clicking opens a dedicated modal based on the task's current state:
 *   1. Active session in-progress: Resume or start fresh.
 *   2. 100% completed: Start fresh or review previous results.
 *   3. First-time / never started: Task briefing with format specs, tips, and start button.
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
    const skillTranslationKey = skillKey(task.section);

    const answered = activeSession?.answeredItemCount ?? 0;
    const total = activeSession?.totalItemCount ?? 0;
    const completedScore = completedSession?.score ?? task.averageScore;

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
            titleIcon={<AppIcon name={iconForTaskType(task.code)} size={22} />}
            closeLabel={t("mode.close")}
            size="sm"
            className="session-choice-dialog"
            footer={
              <button
                type="button"
                className="session-choice-cancel-btn"
                onClick={() => setShowModal(false)}
              >
                {t("mode.close")}
              </button>
            }
          >
            {activeSession ? (
              /* State 1: Active In-Progress Session */
              <div className="session-choice-options">
                <Link
                  className="session-choice-card session-choice-card-resume"
                  href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${activeSession.sessionPublicId}`}
                  onClick={() => setShowModal(false)}
                >
                  <span className="session-choice-icon" aria-hidden="true">
                    <AppIcon name="play" size={20} />
                  </span>
                  <div className="session-choice-content">
                    <div className="session-choice-heading">
                      <span className="session-choice-title">{t("progress.resumeOptionTitle")}</span>
                      <span className="session-choice-badge">
                        {t("progress.resumeOptionBadge")
                          .replace("{answered}", String(answered))
                          .replace("{total}", String(total))}
                      </span>
                    </div>
                    <p className="session-choice-desc">{t("progress.resumeOptionDescription")}</p>
                  </div>
                  <span className="session-choice-arrow" aria-hidden="true">
                    <AppIcon name="chevronRight" size={18} />
                  </span>
                </Link>

                <button
                  type="button"
                  className="session-choice-card session-choice-card-new"
                  onClick={() => {
                    setShowModal(false);
                    onStart(task);
                  }}
                >
                  <span className="session-choice-icon" aria-hidden="true">
                    <AppIcon name="retake" size={20} />
                  </span>
                  <div className="session-choice-content">
                    <div className="session-choice-heading">
                      <span className="session-choice-title">{t("progress.newOptionTitle")}</span>
                    </div>
                    <p className="session-choice-desc">{t("progress.newOptionDescription")}</p>
                  </div>
                  <span className="session-choice-arrow" aria-hidden="true">
                    <AppIcon name="chevronRight" size={18} />
                  </span>
                </button>
              </div>
            ) : isCompleted ? (
              /* State 2: Completed / 100% Session */
              <div className="session-choice-options">
                <div className="session-completed-summary">
                  <span className="session-completed-tag">
                    <AppIcon name="checkCircle" size={16} />
                    {t("progress.completedBadge").replace(
                      "{count}",
                      String(task.answeredQuestionCount || completedSession?.answeredItemCount || 10)
                    )}
                  </span>
                  {completedScore !== null && Number.isFinite(completedScore) ? (
                    <span className={`score-badge score-badge-${scoreTone(completedScore)}`}>
                      {formatScore(completedScore)}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="session-choice-card session-choice-card-new"
                  onClick={() => {
                    setShowModal(false);
                    onStart(task);
                  }}
                >
                  <span className="session-choice-icon" aria-hidden="true">
                    <AppIcon name="retake" size={20} />
                  </span>
                  <div className="session-choice-content">
                    <div className="session-choice-heading">
                      <span className="session-choice-title">{t("progress.newOptionTitle")}</span>
                    </div>
                    <p className="session-choice-desc">{t("progress.newOptionDescription")}</p>
                  </div>
                  <span className="session-choice-arrow" aria-hidden="true">
                    <AppIcon name="chevronRight" size={18} />
                  </span>
                </button>

                <Link
                  className="session-choice-card"
                  href={
                    completedSession?.sessionPublicId
                      ? `${PRACTICE_ROUTES.practiceReview}?sessionId=${completedSession.sessionPublicId}`
                      : PRACTICE_ROUTES.progress
                  }
                  onClick={() => setShowModal(false)}
                >
                  <span className="session-choice-icon session-choice-icon-review" aria-hidden="true">
                    <AppIcon name="star" size={20} />
                  </span>
                  <div className="session-choice-content">
                    <div className="session-choice-heading">
                      <span className="session-choice-title">{t("progress.reviewOptionTitle")}</span>
                    </div>
                    <p className="session-choice-desc">{t("progress.reviewOptionDescription")}</p>
                  </div>
                  <span className="session-choice-arrow" aria-hidden="true">
                    <AppIcon name="chevronRight" size={18} />
                  </span>
                </Link>
              </div>
            ) : (
              /* State 3: First Time / Never Started Briefing */
              <div className="session-briefing-wrap">
                <div className="session-briefing-badges">
                  {skillTranslationKey ? (
                    <span className="session-briefing-chip session-briefing-chip-skill">
                      {t(skillTranslationKey)}
                    </span>
                  ) : null}
                  <span className="session-briefing-chip">
                    {locale === "vi" ? briefing.formatVi : briefing.formatEn}
                  </span>
                  <span className="session-briefing-chip">
                    {t("progress.taskBriefingAIGraded")}
                  </span>
                </div>

                <div className="session-briefing-box">
                  <div className="session-briefing-box-header">
                    <AppIcon name="sparkle" size={16} />
                    <span>{t("progress.taskBriefingTipsHeader")}</span>
                  </div>
                  <p>{locale === "vi" ? briefing.tipVi : briefing.tipEn}</p>
                </div>

                <div className="session-briefing-action">
                  <button
                    type="button"
                    className="button button-primary button-pill session-briefing-start-btn"
                    onClick={() => {
                      setShowModal(false);
                      onStart(task);
                    }}
                  >
                    <AppIcon name="play" size={18} />
                    <span>{t("progress.startPracticeNow")}</span>
                  </button>
                </div>
              </div>
            )}
          </Modal>
        ) : null}
      </div>
    );
  }
);
