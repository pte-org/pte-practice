"use client";

import { AppIcon, LockBadge, ProgressRing } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { canStartPractice, type PracticeCatalogSection, type PracticeCatalogTask } from "@/features/practice/contracts";
import { iconForSection, iconForTaskType } from "@/features/practice/icon-mapping";
import { formatScore, scoreTone, skillKey } from "@/features/practice/presentation";

interface SkillTaskListProps {
  sections: PracticeCatalogSection[];
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
}

/** One card per skill: a heading with the answered count and ring, then each task type with its average score. */
export function SkillTaskList({ sections, isPracticeUnlocked, onStartIntent }: SkillTaskListProps) {
  const { t } = useTranslation();

  return (
    <div className="skill-groups">
      {orderCatalogSections(sections).map((section) => {
        const key = skillKey(section.code);
        const name = key ? t(key) : section.displayName;
        return (
          <section className="card card-flush skill-group" key={section.code} aria-labelledby={`skill-${section.code}`}>
            <div className="skill-group-head">
              <span className="skill-group-icon" aria-hidden="true"><AppIcon name={iconForSection(section.code)} size={20} /></span>
              <span className="skill-group-copy">
                <strong id={`skill-${section.code}`}>{t("presentation.skillItems").replace("{skill}", name)}</strong>
                <span>{section.answeredQuestionCount} {t("presentation.answers")}</span>
              </span>
              <ProgressRing label={`${section.answeredQuestionCount}/${section.practiceQuestionCount}`}
                variant={section.answeredQuestionCount ? "progress" : "empty"}
                value={section.answeredQuestionCount} max={Math.max(1, section.practiceQuestionCount)} size={40}>
                <AppIcon name="reading" size={16} />
              </ProgressRing>
            </div>
            {section.taskTypes.map((task) => {
              const canStart = isPracticeUnlocked && canStartPractice("UNLOCKED", task);
              const blockedLabel = isPracticeUnlocked ? t("common.unavailableAction") : t("common.lockedAction");
              return (
                <button className="skill-task-row card-divider" type="button" key={task.code} disabled={!canStart}
                  aria-label={canStart ? task.displayName : `${task.displayName}: ${blockedLabel}`}
                  onClick={() => onStartIntent(task)}>
                  <span className="skill-task-icon" aria-hidden="true"><AppIcon name={iconForTaskType(task.code)} size={20} /></span>
                  <span className="skill-task-copy">
                    <strong>{task.displayName}</strong>
                    <span>{task.answeredQuestionCount} {t("presentation.answers")}</span>
                  </span>
                  {canStart
                    ? <span className={`score-badge score-badge-${scoreTone(task.averageScore)}`}>{formatScore(task.averageScore)}</span>
                    : <LockBadge locked label={blockedLabel} />}
                  <span className="skill-list-action" aria-hidden="true"><AppIcon name={canStart ? "chevronRight" : "lock"} size={18} /></span>
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
