"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeCatalogTask } from "./contracts";
import { iconForTaskType } from "./icon-mapping";
import { taskDisplayName } from "./presentation";

export interface TaskActionButtonsProps {
  task: PracticeCatalogTask;
  activeSession?: {
    sessionPublicId: string;
    answeredItemCount?: number;
    totalItemCount?: number;
  } | null;
  canStart: boolean;
  onStart: (task: PracticeCatalogTask) => void;
  className?: string;
}

/**
 * Reusable action button for practice tasks.
 * Displays a single clean chevron right (>) button on the row.
 * When an active session is in-progress:
 * - Clicking opens a modal with 2 clear options:
 *   1. Resume existing session (Tiếp tục bài đang làm)
 *   2. Start fresh session (Luyện bài mới)
 * When no session is in-progress:
 * - Directly starts practice.
 */
export const TaskActionButtons = forwardRef<HTMLButtonElement, TaskActionButtonsProps>(
  function TaskActionButtons(
    {
      task,
      activeSession,
      canStart,
      onStart,
      className,
    },
    ref
  ) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const handleActionClick = () => {
      if (!canStart) return;
      if (activeSession) {
        setShowModal(true);
      } else {
        onStart(task);
      }
    };

    const answered = activeSession?.answeredItemCount ?? 0;
    const total = activeSession?.totalItemCount ?? 0;

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

        {showModal && activeSession ? (
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
          </Modal>
        ) : null}
      </div>
    );
  }
);

