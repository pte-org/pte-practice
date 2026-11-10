"use client";

import Link from "next/link";
import type { ReactElement, Ref } from "react";
import { AppIcon, Button } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PRACTICE_ROUTES } from "./constants";
import type { PracticeCatalogTask } from "./contracts";

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
  const { t } = useTranslation();
  const label = t(activeSession ? "progress.resume" : "progress.practise");
  return (
    <div ref={ref} className={`skill-task-actions ${className ?? ""}`.trim()}>
      {activeSession && canStart ? (
        <Link className="task-chevron-btn" href={`${PRACTICE_ROUTES.practiceSession}?sessionId=${encodeURIComponent(activeSession.sessionPublicId)}`} aria-label={label} title={label}>
          <AppIcon name="chevronRight" size={20} />
        </Link>
      ) : (
        <button className="task-chevron-btn" type="button" disabled={!canStart} onClick={() => onStart(task)} aria-label={label} title={label}>
          <AppIcon name="chevronRight" size={20} />
        </button>
      )}
      {activeSession ? <Button variant="secondary" appearance="fill" size="sm" className="task-new-set-button"
        disabled={!canStart} onClick={() => onStart(task)} leftIcon={<AppIcon name="retake" size={16} />}>
        {t("progress.startNewSetAction")}
      </Button> : null}
      {!activeSession && completedSession && canStart ? <Link className="text-link" href={`${PRACTICE_ROUTES.practiceReview}?sessionId=${encodeURIComponent(completedSession.sessionPublicId)}`}>{t("progress.review")}</Link> : null}
    </div>
  );
};
