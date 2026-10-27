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

type LaunchMode = "resume" | "fresh" | "review";

/**
 * Reusable action button for practice tasks.
 * Displays a single clean chevron right (>) button on the row.
 * Clicking opens a modern, Duolingo/Quizlet-style task briefing and session launcher modal
 * with Radio Choice options and a single "Bắt đầu ngay" launch action.
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
    const [selectedMode, setSelectedMode] = useState<LaunchMode>(
      activeSession ? "resume" : "fresh"
    );

    const handleActionClick = () => {
      if (!canStart) return;
      setSelectedMode(activeSession ? "resume" : "fresh");
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

            {/* Section: Radio Choices */}
            <h3 className="pte-section-label">{t("progress.practiceOptionsLabel")}</h3>

            <div className="pte-options-group" role="radiogroup" aria-label={t("progress.practiceOptionsLabel")}>
              {activeSession ? (
                <>
                  <div
                    className={`pte-option-card${selectedMode === "resume" ? " selected" : ""}`}
                    role="radio"
                    aria-checked={selectedMode === "resume"}
                    tabIndex={0}
                    onClick={() => setSelectedMode("resume")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedMode("resume");
                    }}
                  >
                    <span className={`pte-radio-circle${selectedMode === "resume" ? " checked" : ""}`}>
                      {selectedMode === "resume" ? <span className="pte-radio-dot" /> : null}
                    </span>
                    <span className="pte-option-icon">
                      <AppIcon name="play" size={18} />
                    </span>
                    <div className="pte-option-copy">
                      <strong className="pte-option-title">{t("progress.resumeOptionTitle")}</strong>
                      <p className="pte-option-subtitle">{t("progress.resumeOptionDescription")}</p>
                    </div>
                    <div className="pte-option-badges">
                      <span className="pte-option-chip">
                        <AppIcon name="timer" size={13} />
                        {locale === "vi" ? briefing.durationVi : briefing.durationEn}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`pte-option-card${selectedMode === "fresh" ? " selected" : ""}`}
                    role="radio"
                    aria-checked={selectedMode === "fresh"}
                    tabIndex={0}
                    onClick={() => setSelectedMode("fresh")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedMode("fresh");
                    }}
                  >
                    <span className={`pte-radio-circle${selectedMode === "fresh" ? " checked" : ""}`}>
                      {selectedMode === "fresh" ? <span className="pte-radio-dot" /> : null}
                    </span>
                    <span className="pte-option-icon">
                      <AppIcon name="retake" size={18} />
                    </span>
                    <div className="pte-option-copy">
                      <strong className="pte-option-title">{t("progress.newOptionTitle")}</strong>
                      <p className="pte-option-subtitle">{t("progress.newOptionDescription")}</p>
                    </div>
                    <div className="pte-option-badges">
                      <span className="pte-option-chip">
                        <AppIcon name="responses" size={13} />
                        10 {t("presentation.questions")}
                      </span>
                    </div>
                  </div>
                </>
              ) : isCompleted ? (
                <>
                  <div
                    className={`pte-option-card${selectedMode === "fresh" ? " selected" : ""}`}
                    role="radio"
                    aria-checked={selectedMode === "fresh"}
                    tabIndex={0}
                    onClick={() => setSelectedMode("fresh")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedMode("fresh");
                    }}
                  >
                    <span className={`pte-radio-circle${selectedMode === "fresh" ? " checked" : ""}`}>
                      {selectedMode === "fresh" ? <span className="pte-radio-dot" /> : null}
                    </span>
                    <span className="pte-option-icon">
                      <AppIcon name="retake" size={18} />
                    </span>
                    <div className="pte-option-copy">
                      <strong className="pte-option-title">{t("progress.newOptionTitle")}</strong>
                      <p className="pte-option-subtitle">{t("progress.newOptionDescription")}</p>
                    </div>
                    <div className="pte-option-badges">
                      <span className="pte-option-chip">
                        <AppIcon name="responses" size={13} />
                        10 {t("presentation.questions")}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`pte-option-card${selectedMode === "review" ? " selected" : ""}`}
                    role="radio"
                    aria-checked={selectedMode === "review"}
                    tabIndex={0}
                    onClick={() => setSelectedMode("review")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedMode("review");
                    }}
                  >
                    <span className={`pte-radio-circle${selectedMode === "review" ? " checked" : ""}`}>
                      {selectedMode === "review" ? <span className="pte-radio-dot" /> : null}
                    </span>
                    <span className="pte-option-icon">
                      <AppIcon name="responses" size={18} />
                    </span>
                    <div className="pte-option-copy">
                      <strong className="pte-option-title">{t("progress.reviewOptionTitle")}</strong>
                      <p className="pte-option-subtitle">{t("progress.reviewOptionDescription")}</p>
                    </div>
                    {completedScore !== null && Number.isFinite(completedScore) ? (
                      <div className="pte-option-badges">
                        <span className="pte-option-chip">
                          {formatScore(completedScore)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div
                  className="pte-option-card selected"
                  role="radio"
                  aria-checked={true}
                  tabIndex={0}
                >
                  <span className="pte-radio-circle checked">
                    <span className="pte-radio-dot" />
                  </span>
                  <span className="pte-option-icon">
                    <AppIcon name="bookOpen" size={18} />
                  </span>
                  <div className="pte-option-copy">
                    <strong className="pte-option-title">{t("progress.quickPracticeTitle")}</strong>
                    <p className="pte-option-subtitle">{t("progress.quickPracticeSubtitle")}</p>
                  </div>
                  <div className="pte-option-badges">
                    <span className="pte-option-chip">
                      <AppIcon name="timer" size={13} />
                      {locale === "vi" ? briefing.durationVi : briefing.durationEn}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Practical Study Tip Box */}
            <div className="pte-tip-box">
              <span className="pte-tip-icon">
                <AppIcon name="info" size={18} />
              </span>
              <p className="pte-tip-text">{locale === "vi" ? briefing.tipVi : briefing.tipEn}</p>
            </div>

            {/* Bottom Single Primary CTA: Chốt Bắt đầu */}
            {selectedMode === "resume" && activeSession ? (
              <Link
                className="pte-primary-cta"
                href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${activeSession.sessionPublicId}`}
                onClick={() => setShowModal(false)}
              >
                <AppIcon name="play" size={18} />
                <span>{t("progress.startNowAction")}</span>
              </Link>
            ) : selectedMode === "review" && completedSession ? (
              <Link
                className="pte-primary-cta"
                href={`${PRACTICE_ROUTES.practiceReview}?sessionId=${completedSession.sessionPublicId}`}
                onClick={() => setShowModal(false)}
              >
                <AppIcon name="responses" size={18} />
                <span>{t("progress.review")}</span>
              </Link>
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
                <span>{t("progress.startNowAction")}</span>
              </button>
            )}
          </Modal>
        ) : null}
      </div>
    );
  }
);
