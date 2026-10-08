"use client";

import { AppIcon, LockBadge } from "@/common/components";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { UI_TEXT } from "@/features/practice/constants";
import { canStartPractice, type PracticeCatalogSection, type PracticeCatalogTask } from "@/features/practice/contracts";
import { iconForSection, iconForTaskType } from "@/features/practice/icon-mapping";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

interface SkillTaskListProps {
  sections: PracticeCatalogSection[];
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
}

export function SkillTaskList({ sections, isPracticeUnlocked, onStartIntent }: SkillTaskListProps) {
  const { t } = useTranslation();
  const orderedSections = orderCatalogSections(sections);

  return (
    <div className="home-skill-list">
      {orderedSections.map((section) => {
        const sectionCanStart = isPracticeUnlocked && section.taskTypes.some(
          (task) => canStartPractice("UNLOCKED", task),
        );
        const sectionStatus = !isPracticeUnlocked
          ? t("common.lockedAction")
          : t("common.unavailableAction");

        return (
          <section className="home-skill-section" key={section.code} aria-labelledby={`home-skill-${section.code}`}>
            <div className="home-skill-heading">
              <span className="skill-list-icon" aria-hidden="true">
                <AppIcon name={iconForSection(section.code)} size={19} />
              </span>
              <span className="skill-list-copy">
                <strong id={`home-skill-${section.code}`}>{t(`skills.${section.code.toLowerCase()}` as TranslationKey) || section.displayName} {t("catalog.items")}</strong>
                <span>{section.taskTypes.length} {t("catalog.taskTypes")}</span>
              </span>
              {!sectionCanStart ? <LockBadge locked label={sectionStatus} /> : null}
            </div>
            <div className="home-skill-task-list">
              {section.taskTypes.map((task) => {
                const canStart = isPracticeUnlocked && canStartPractice("UNLOCKED", task);
                const isUnavailable = task.availability === "UNAVAILABLE"
                  || (isPracticeUnlocked && !canStart);
                const statusLabel = isUnavailable
                  ? t("common.unavailableAction")
                  : t("catalog.unlockPracticeToBegin");

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
                      <AppIcon name={iconForTaskType(task.code)} size={17} />
                    </span>
                    <span className="skill-task-copy">
                      <strong>{task.displayName}</strong>
                      {!canStart ? <span>{statusLabel}</span> : null}
                    </span>
                    {!canStart ? <LockBadge locked label={statusLabel} /> : null}
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
