"use client";

import { AppIcon, ProgressRing } from "@/common/components";
import type { ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import type { PracticeCatalogSection, PracticeCatalogTask, PracticeProgressEntry } from "@/features/practice/contracts";
import { iconForSection } from "@/features/practice/icon-mapping";
import { skillKey } from "@/features/practice/presentation";
import { SkillTaskRow } from "@/features/practice/SkillTaskRow";
import type { PracticeAccessState } from "@/features/practice/access-state";
import { latestActiveTaskSession } from "@/features/practice/task-session";

interface SkillTaskListProps {
  sections: PracticeCatalogSection[];
  isPracticeUnlocked: boolean;
  onStartIntent: (task: PracticeCatalogTask) => void;
  progressEntries?: PracticeProgressEntry[];
  /** Limit displayed groups after canonical task ordering (used by the home skill filter). */
  sectionCode?: string;
  /** Hide the skill summary header when the surrounding page already provides the grouping context. */
  showGroupHeader?: boolean;
  /** Allow the home overview to label skills without displaying aggregate progress. */
  showGroupProgress?: boolean;
  accessState?: PracticeAccessState;
  contentState?: "ready" | "loading" | "error";
}

/** One card per skill: a heading with the answered count and ring, then each task type with its average score. */
export const SkillTaskList = ({ sections, isPracticeUnlocked, onStartIntent, progressEntries, sectionCode,
  showGroupHeader = true, showGroupProgress = true, accessState, contentState }: SkillTaskListProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="skill-groups">
      {orderCatalogSections(sections).filter((section) => !sectionCode || section.code === sectionCode).map((section) => {
        const key = skillKey(section.code);
        const name = key ? t(key) : section.displayName;
        return (
          <section className="card card-flush skill-group" key={section.code}
            aria-labelledby={showGroupHeader ? `skill-${section.code}` : undefined}
            aria-label={showGroupHeader ? undefined : name}>
            {showGroupHeader ? <div className="skill-group-head">
              <span className="skill-group-icon" aria-hidden="true"><AppIcon name={iconForSection(section.code)} size={20} /></span>
              <span className="skill-group-copy">
                <strong id={`skill-${section.code}`}>{t("presentation.skillItems").replace("{skill}", name)}</strong>
                {showGroupProgress ? <span>{section.answeredQuestionCount} {t("presentation.answers")}</span> : null}
              </span>
              {showGroupProgress ? <ProgressRing label={`${section.answeredQuestionCount}/${section.practiceQuestionCount}`}
                variant={section.answeredQuestionCount ? "progress" : "empty"}
                value={section.answeredQuestionCount} max={Math.max(1, section.practiceQuestionCount)} size={40}>
                <AppIcon name="reading" size={16} />
              </ProgressRing> : null}
            </div> : null}
            {section.taskTypes.map((task) => {
              const activeSession = latestActiveTaskSession(progressEntries ?? [], task.code);
              const completedSession = progressEntries?.find(
                (entry) =>
                  entry.taskCode === task.code &&
                  (entry.status !== "IN_PROGRESS" && entry.sessionStatus !== "IN_PROGRESS"),
              );
              return (
                <SkillTaskRow
                  key={task.code}
                  className="card-divider"
                  task={task}
                  isPracticeUnlocked={isPracticeUnlocked}
                  accessState={accessState}
                  contentState={contentState}
                  activeSession={activeSession}
                  completedSession={completedSession}
                  onStart={onStartIntent}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
};
