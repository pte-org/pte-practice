"use client";

import { useRef, type ReactElement } from "react";
import type { PracticeAccessState } from "./access-state";
import { AppIcon, LockBadge } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { canStartPractice, type PracticeCatalogTask } from "./contracts";
import { iconForTaskType } from "./icon-mapping";
import { formatScore, scoreTone, taskDisplayName } from "./presentation";
import { TaskActionButtons } from "./TaskActionButtons";

export interface SkillTaskRowProps {
  task: PracticeCatalogTask;
  isPracticeUnlocked: boolean;
  accessState?: PracticeAccessState;
  contentState?: "ready" | "loading" | "error";
  activeSession?: {
    sessionPublicId: string;
    answeredItemCount: number;
    totalItemCount: number;
  } | null;
  completedSession?: {
    sessionPublicId: string;
    answeredItemCount?: number;
    totalItemCount?: number;
    score?: number | null;
  } | null;
  onStart: (task: PracticeCatalogTask) => void;
  className?: string;
}

/**
 * Unified task row component used in both Trang chủ (Home) and Tiến độ (Progress).
 * Includes icon, title, question counts, in-progress indicator, score/lock badge, and chevron right action.
 */
export const SkillTaskRow = ({
  task,
  isPracticeUnlocked,
  activeSession,
  completedSession,
  onStart,
  className,
  accessState,
  contentState = "ready",
}: SkillTaskRowProps): ReactElement => {
  const { t } = useTranslation();
  const state = accessState ?? (isPracticeUnlocked ? "unlocked" : "locked");
  const canStart = contentState === "ready" && isPracticeUnlocked && canStartPractice("UNLOCKED", task);
  const blockedLabel = state === "locked" ? t("common.lockedAction")
    : state === "error" || contentState === "error" ? t("common.unavailableAction")
      : state === "loading" || contentState === "loading" ? t("ui.accessChecking") : t("common.unavailableAction");
  const actionRef = useRef<HTMLDivElement>(null);

  const handleRowClick = (e: React.MouseEvent) => {
    if (!canStart) return;
    if (
      (e.target as HTMLElement).closest(".skill-task-actions") ||
      (e.target as HTMLElement).closest(".modal-backdrop") ||
      (e.target as HTMLElement).closest(".modal-dialog")
    ) {
      return;
    }
    actionRef.current?.querySelector<HTMLElement>(".task-primary-action")?.click();
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
          {task.availableQuestionCount > 0
            ? t("presentation.answeredOfTotal").replace("{answered}", String(Math.min(task.answeredQuestionCount,
              task.availableQuestionCount))).replace("{total}", String(task.availableQuestionCount))
            : task.answeredQuestionCount > 0
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
        state === "locked" ? <LockBadge locked label={blockedLabel} /> : <span className="quiet-note" role="status">{blockedLabel}</span>
      ) : task.averageScore !== null && Number.isFinite(task.averageScore) ? (
        <span className={`score-badge score-badge-${scoreTone(task.averageScore)}`}>
          {formatScore(task.averageScore)}
        </span>
      ) : null}
      <TaskActionButtons
        ref={actionRef}
        task={task}
        activeSession={activeSession}
        completedSession={completedSession}
        canStart={canStart}
        onStart={onStart}
      />
    </div>
  );
};
