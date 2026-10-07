"use client";

import { AppIcon, iconForSection } from "@/features/icons/AppIcon";
import type { PracticeCatalogTask } from "@/features/practice/contracts";
import { UI_TEXT } from "@/features/practice/constants";
import { canStartPractice } from "@/features/practice/contracts";
import { LockBadge } from "@/features/common/LockBadge";

interface CatalogCardProps {
  task: PracticeCatalogTask;
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
}

export function CatalogCard({ task, isPracticeUnlocked, onStartIntent }: CatalogCardProps) {
  const canStart = canStartPractice(isPracticeUnlocked ? "UNLOCKED" : "LOCKED", task);
  const isUnavailable = task.availability === "UNAVAILABLE" || (isPracticeUnlocked && !canStart);
  const badgeLabel = canStart
    ? "Available"
    : isUnavailable
      ? UI_TEXT.unavailableAction
      : UI_TEXT.lockedAction;

  return (
    <article className={`catalog-card${canStart ? " catalog-card-ready" : " catalog-card-locked"}`}>
      <div className="catalog-card-topline">
        <span className="task-icon" aria-hidden="true"><AppIcon name={iconForSection(task.section)} size={21} /></span>
        <LockBadge locked={!canStart} label={badgeLabel} />
      </div>
      <h3>{task.displayName}</h3>
      <p>{task.scored ? "Scored practice item" : "Practice item"}</p>
      <button
        className={`button catalog-action${canStart ? " button-accent" : " button-muted"}`}
        type="button"
        disabled={!canStart}
        aria-label={canStart ? `Start ${task.displayName}` : `${task.displayName} is locked`}
        onClick={() => onStartIntent(task)}
      >
        <AppIcon name={canStart ? "play" : "lock"} size={15} />
        {canStart ? UI_TEXT.availableAction : badgeLabel}
      </button>
    </article>
  );
}
