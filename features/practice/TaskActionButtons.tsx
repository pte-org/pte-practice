"use client";

import Link from "next/link";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeCatalogTask } from "./contracts";

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
 * Reusable action buttons for practice tasks.
 * When an active session is in-progress:
 * - Outline button: "Tiếp tục" (Resume link)
 * - Ghost button: "Luyện tiếp dạng này" (Start new practice session)
 * When no session is in-progress:
 * - Outline button: "Luyện" (Start practice)
 */
export function TaskActionButtons({
  task,
  activeSession,
  canStart,
  onStart,
  className,
}: TaskActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className={`skill-task-actions ${className ?? ""}`.trim()}>
      {activeSession ? (
        <Link
          className="button button-outline button-pill"
          href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${activeSession.sessionPublicId}`}
        >
          {t("progress.resume")}
        </Link>
      ) : null}
      <button
        className={`button ${activeSession ? "button-ghost" : "button-outline"} button-pill`}
        type="button"
        disabled={!canStart}
        onClick={() => onStart(task)}
      >
        {activeSession ? t("review.practiseAgain") : t("progress.practise")}
      </button>
    </div>
  );
}
