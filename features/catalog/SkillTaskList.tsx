"use client";

import { AppIcon, ProgressRing } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import type { PracticeCatalogSection, PracticeCatalogTask, PracticeProgressEntry } from "@/features/practice/contracts";
import { iconForSection } from "@/features/practice/icon-mapping";
import { skillKey } from "@/features/practice/presentation";
import { SkillTaskRow } from "@/features/practice/SkillTaskRow";

interface SkillTaskListProps {
  sections: PracticeCatalogSection[];
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
  progressEntries?: PracticeProgressEntry[];
}

/** One card per skill: a heading with the answered count and ring, then each task type with its average score. */
export function SkillTaskList({ sections, isPracticeUnlocked, onStartIntent, progressEntries }: SkillTaskListProps) {
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
              const activeSession = progressEntries?.find(
                (entry) =>
                  entry.taskCode === task.code &&
                  (entry.status === "IN_PROGRESS" || entry.sessionStatus === "IN_PROGRESS"),
              );
              return (
                <SkillTaskRow
                  key={task.code}
                  className="card-divider"
                  task={task}
                  isPracticeUnlocked={isPracticeUnlocked}
                  activeSession={activeSession}
                  onStart={onStartIntent}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
