"use client";

import { AppIcon, LockBadge } from "@/common/components";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import type { PracticeCatalogTask } from "@/features/practice/contracts";
import { canStartPractice } from "@/features/practice/contracts";
import { useTranslation } from "@/common/i18n";

interface CatalogCardProps {
  task: PracticeCatalogTask;
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
}

export function CatalogCard({ task, isPracticeUnlocked, onStartIntent }: CatalogCardProps) {
  const { t } = useTranslation();
  const canStart = canStartPractice(isPracticeUnlocked ? "UNLOCKED" : "LOCKED", task);
  const isUnavailable = task.availability === "UNAVAILABLE" || (isPracticeUnlocked && !canStart);
  const badgeLabel = isUnavailable
    ? t("common.unavailableAction")
    : t("common.lockedAction");

  return (
    <article className={`catalog-card${canStart ? " catalog-card-ready" : " catalog-card-locked"}`}>
      <div className="catalog-card-topline">
        <span className="task-icon" aria-hidden="true"><AppIcon name={iconForTaskType(task.code)} size={21} /></span>
        {!canStart ? <LockBadge locked label={badgeLabel} /> : null}
      </div>
      <h3>{task.displayName}</h3>
      <p>{task.scored ? t("catalog.scoredPracticeItem") : t("catalog.practiceItem")}</p>
      <button
        className={`button catalog-action${canStart ? " button-accent" : " button-muted"}`}
        type="button"
        disabled={!canStart}
        aria-label={canStart ? `Start ${task.displayName}` : `${task.displayName} is locked`}
        onClick={() => onStartIntent(task)}
      >
        <AppIcon name={canStart ? "play" : "lock"} size={15} />
        {canStart ? t("ui.availableAction") : badgeLabel}
      </button>
    </article>
  );
}
