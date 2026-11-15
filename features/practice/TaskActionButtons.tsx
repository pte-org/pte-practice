"use client";

import { usePathname } from "next/navigation";
import type { ReactElement, Ref } from "react";
import { AppIcon, ArrowAction, Button } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeCatalogTask } from "./contracts";
import { reviewHref } from "./review-return";

export interface TaskActionButtonsProps {
  task: PracticeCatalogTask;
  activeSession?: { sessionPublicId: string; answeredItemCount?: number; totalItemCount?: number } | null;
  completedSession?: { sessionPublicId: string; answeredItemCount?: number; totalItemCount?: number; score?: number | null } | null;
  canStart: boolean;
  onStart: (task: PracticeCatalogTask) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export const TaskActionButtons = ({ task, activeSession, completedSession, canStart, onStart, className, ref }: TaskActionButtonsProps): ReactElement => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const resumeHref = activeSession
    ? `${PRACTICE_ROUTES.practiceSession}?sessionId=${encodeURIComponent(activeSession.sessionPublicId)}` : undefined;
  // One labelled main action (the row click triggers it): resume a live session, else start a set. A new set puts the
  // unanswered questions first, so it reads "Luyện tiếp" while some are left and "Luyện lại" once all are answered.
  const allAnswered = task.availableQuestionCount > 0 && task.answeredQuestionCount >= task.availableQuestionCount;
  const startOver = Boolean(completedSession) && allAnswered;
  const startLabel = t(!completedSession ? "progress.practise"
    : startOver ? "progress.practiseNewSet" : "progress.practiseRemaining");
  return (
    <div ref={ref} className={`skill-task-actions ${className ?? ""}`.trim()}>
      {!activeSession && completedSession && canStart
        ? <ArrowAction label={t("progress.review")} href={reviewHref(completedSession.sessionPublicId, pathname)} /> : null}
      {activeSession ? <Button variant="secondary" appearance="fill" size="sm" className="task-new-set-button"
        disabled={!canStart} onClick={() => onStart(task)} leftIcon={<AppIcon name="retake" size={16} />}>
        {t("progress.startNewSetAction")}
      </Button> : null}
      {activeSession && canStart
        ? <ArrowAction className="task-primary-action" label={t("progress.resume")} href={resumeHref} />
        : <ArrowAction className="task-primary-action" label={startLabel} icon={startOver ? "retake" : undefined} disabled={!canStart} onClick={() => onStart(task)} />}
    </div>
  );
};
