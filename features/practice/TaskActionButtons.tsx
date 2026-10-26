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
    const [choice, setChoice] = useState<"resume" | "new">("resume");

    const handleActionClick = () => {
      if (!canStart) return;
      if (activeSession) {
        setChoice("resume");
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
            footer={
              <>
                <button
                  className="button button-pill button-outline-danger"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  {t("mode.close")}
                </button>
                {choice === "resume" ? (
                  <Link
                    className="button button-outline button-pill"
                    href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${activeSession.sessionPublicId}`}
                    onClick={() => setShowModal(false)}
                  >
                    {t("progress.startSession")}
                  </Link>
                ) : (
                  <button
                    className="button button-outline button-pill"
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      onStart(task);
                    }}
                  >
                    {t("progress.startSession")}
                  </button>
                )}
              </>
            }
          >
            <div className="mode-options" role="radiogroup" aria-label={t("progress.sessionChoiceTitle")}>
              <button
                type="button"
                role="radio"
                aria-checked={choice === "resume"}
                className={`mode-option${choice === "resume" ? " mode-option-selected" : ""}`}
                onClick={() => setChoice("resume")}
              >
                <span className="mode-option-title">
                  <AppIcon name="play" size={18} />
                  {t("progress.resumeOptionTitle")}
                </span>
                <span className="mode-option-description">
                  {t("progress.resumeOptionDescription")
                    .replace("{answered}", String(answered))
                    .replace("{total}", String(total))}
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={choice === "new"}
                className={`mode-option${choice === "new" ? " mode-option-selected" : ""}`}
                onClick={() => setChoice("new")}
              >
                <span className="mode-option-title">
                  <AppIcon name="retake" size={18} />
                  {t("progress.newOptionTitle")}
                </span>
                <span className="mode-option-description">
                  {t("progress.newOptionDescription")}
                </span>
              </button>
            </div>
          </Modal>
        ) : null}
      </div>
    );
  }
);

