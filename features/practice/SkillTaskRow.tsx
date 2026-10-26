"use client";

import { useRef } from "react";
import { AppIcon, LockBadge } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { canStartPractice, type PracticeCatalogTask } from "./contracts";
import { iconForTaskType } from "./icon-mapping";
import { formatScore, scoreTone, taskDisplayName } from "./presentation";
import { TaskActionButtons } from "./TaskActionButtons";

export interface SkillTaskRowProps {
  task: PracticeCatalogTask;
  isPracticeUnlocked: boolean;
  activeSession?: {
    sessionPublicId: string;
    answeredItemCount: number;
    totalItemCount: number;
  } | null;
  onStart: (task: PracticeCatalogTask) => void;
  className?: string;
}

/**
 * Unified task row component used in both Trang chủ (Home) and Tiến độ (Progress).
 * Includes icon, title, question counts, in-progress indicator, score/lock badge, and chevron right action.
 */
export function SkillTaskRow({
  task,
  isPracticeUnlocked,
  activeSession,
  onStart,
  className,
}: SkillTaskRowProps) {
  const { t } = useTranslation();
  const canStart = isPracticeUnlocked && canStartPractice("UNLOCKED", task);
  const blockedLabel = isPracticeUnlocked ? t("common.unavailableAction") : t("common.lockedAction");
  const actionRef = useRef<HTMLButtonElement>(null);

  const handleRowClick = (e: React.MouseEvent) => {
    if (!canStart) return;
    if (
      (e.target as HTMLElement).closest(".task-chevron-btn") ||
      (e.target as HTMLElement).closest(".modal-backdrop") ||
      (e.target as HTMLElement).closest(".modal-dialog")
    ) {
      return;
    }
    actionRef.current?.click();
  };

  return (
    <div
      className={`skill-task-row ${canStart ? "skill-task-row-ready" : ""} ${className ?? ""}`.trim()}
      onClick={handleRowClick}
    >
      <span className="skill-task-icon" aria-hidden="true">
        <AppIcon name={iconForTaskType(task.code)} size={20} />
      </span>
      <span className="skill-task-copy">
        <strong>{taskDisplayName(task.code, task.displayName, t)}</strong>
        <span>
          {task.answeredQuestionCount > 0
            ? `${task.answeredQuestionCount} ${t("presentation.answers")}`
            : t("presentation.statusPending")}
          {activeSession ? (
            <span className="active-session-indicator">
              {" "}· {t("progress.inProgress")} ({activeSession.answeredItemCount}/{activeSession.totalItemCount})
            </span>
          ) : null}
        </span>
      </span>
      {!canStart ? (
        <LockBadge locked label={blockedLabel} />
      ) : task.averageScore !== null && Number.isFinite(task.averageScore) ? (
        <span className={`score-badge score-badge-${scoreTone(task.averageScore)}`}>
          {formatScore(task.averageScore)}
        </span>
      ) : null}
      <TaskActionButtons
        ref={actionRef}
        task={task}
        activeSession={activeSession}
        canStart={canStart}
        onStart={onStart}
      />
    </div>
  );
}
