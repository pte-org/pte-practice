"use client";

import { AppIcon, LockBadge } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { canStartPractice, type PracticeCatalogTask } from "./contracts";
import { iconForTaskType } from "./icon-mapping";
import { formatScore, scoreTone } from "./presentation";
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
 * Includes icon, title, question counts, in-progress indicator, score/lock badge, and TaskActionButtons.
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

  return (
    <div className={`skill-task-row ${className ?? ""}`.trim()}>
      <span className="skill-task-icon" aria-hidden="true">
        <AppIcon name={iconForTaskType(task.code)} size={20} />
      </span>
      <span className="skill-task-copy">
        <strong>{task.displayName}</strong>
        <span>
          {task.answeredQuestionCount} {t("presentation.answers")}
          {activeSession ? (
            <span className="active-session-indicator">
              {" "}· {t("progress.inProgress")} ({activeSession.answeredItemCount}/{activeSession.totalItemCount})
            </span>
          ) : null}
        </span>
      </span>
      {canStart ? (
        <span className={`score-badge score-badge-${scoreTone(task.averageScore)}`}>
          {formatScore(task.averageScore)}
        </span>
      ) : (
        <LockBadge locked label={blockedLabel} />
      )}
      <TaskActionButtons
        task={task}
        activeSession={activeSession}
        canStart={canStart}
        onStart={onStart}
      />
    </div>
  );
}
