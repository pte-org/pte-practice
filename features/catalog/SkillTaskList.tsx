"use client";

import { LockBadge } from "@/features/common/LockBadge";
import { AppIcon, iconForSection } from "@/features/icons/AppIcon";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { UI_TEXT } from "@/features/practice/constants";
import { canStartPractice, type PracticeCatalogSection, type PracticeCatalogTask } from "@/features/practice/contracts";

interface SkillTaskListProps {
  sections: PracticeCatalogSection[];
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
}

export function SkillTaskList({ sections, isPracticeUnlocked, onStartIntent }: SkillTaskListProps) {
  const orderedSections = orderCatalogSections(sections);

  return (
    <div className="home-skill-list">
      {orderedSections.map((section) => {
        const sectionCanStart = isPracticeUnlocked && section.taskTypes.some(
          (task) => canStartPractice("UNLOCKED", task),
        );
        const sectionStatus = !isPracticeUnlocked
          ? UI_TEXT.lockedAction
          : sectionCanStart
            ? "Ready"
            : UI_TEXT.unavailableAction;

        return (
          <section className="home-skill-section" key={section.code} aria-labelledby={`home-skill-${section.code}`}>
            <div className="home-skill-heading">
              <span className="skill-list-icon" aria-hidden="true">
                <AppIcon name={iconForSection(section.code)} size={19} />
              </span>
              <span className="skill-list-copy">
                <strong id={`home-skill-${section.code}`}>{section.displayName} items</strong>
                <span>{section.taskTypes.length} task types</span>
              </span>
              <LockBadge locked={!sectionCanStart} label={sectionStatus} />
            </div>
            <div className="home-skill-task-list">
              {section.taskTypes.map((task) => {
                const canStart = isPracticeUnlocked && canStartPractice("UNLOCKED", task);
                const isUnavailable = task.availability === "UNAVAILABLE"
                  || (isPracticeUnlocked && !canStart);
                const statusLabel = canStart
                  ? "Ready to practice"
                  : isUnavailable
                    ? UI_TEXT.unavailableAction
                    : "Unlock practice to begin";

                return (
                  <button
                    className={`skill-task-row${canStart ? " skill-task-row-ready" : ""}`}
                    disabled={!canStart}
                    key={task.code}
                    type="button"
                    aria-label={canStart ? `Start ${task.displayName}` : `${task.displayName}: ${statusLabel}`}
                    onClick={() => onStartIntent(task)}
                  >
                    <span className="skill-task-icon" aria-hidden="true">
                      <AppIcon name={iconForSection(task.section)} size={17} />
                    </span>
                    <span className="skill-task-copy">
                      <strong>{task.displayName}</strong>
                      <span>{statusLabel}</span>
                    </span>
                    <LockBadge locked={!canStart} label={canStart ? "Ready" : statusLabel} />
                    <span className="skill-list-action" aria-hidden="true">
                      <AppIcon name={canStart ? "chevronRight" : "lock"} size={17} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
