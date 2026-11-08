"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { AppIcon, LoadingState, Tabs } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeCatalogSection, PracticeCatalogTask, PracticeProgressEntry } from "@/features/practice/contracts";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { skillKey, sessionDisplayName } from "@/features/practice/presentation";
import { SkillTaskList } from "@/features/catalog/SkillTaskList";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { ExamDateLine } from "./ExamDateLine";
import { DASHBOARD_COPY, DASHBOARD_RECENT_ITEMS } from "./constants";
import type { PracticeAccessState } from "@/features/practice/access-state";
export { DashboardRecommendations } from "./DashboardResume";

interface DashboardTaskTypesProps {
  sections: PracticeCatalogSection[];
  unlocked: boolean;
  ready: boolean;
  entries: PracticeProgressEntry[];
  onStart: (task: PracticeCatalogTask) => void;
  accessState?: PracticeAccessState;
  contentState?: "ready" | "loading" | "error";
}

export const DashboardTaskTypes = ({ sections, unlocked, ready, entries, onStart, accessState, contentState }: DashboardTaskTypesProps): ReactElement => {
  const { t, locale } = useTranslation();
  const copy = DASHBOARD_COPY[locale];
  const [selected, setSelected] = useState("ALL");
  const ordered = orderCatalogSections(sections);
  const items = [{ id: "ALL", label: copy.allTasks }, ...ordered.map((section) => {
    const key = skillKey(section.code);
    return { id: section.code, label: key ? t(key) : section.displayName };
  })];
  return (
    <section className="dashboard-section dashboard-task-types" aria-labelledby="dashboard-tasks-title" aria-busy={!ready}>
      <div className="dashboard-section-heading">
        <div><h2 id="dashboard-tasks-title">{copy.tasks}</h2><p>{copy.tasksHint}</p></div>
      </div>
      <Tabs id="dashboard-tasks" ariaLabel={copy.tasks} value={selected} onChange={setSelected} items={items} variant="minimal" />
      <div role="tabpanel" id={`dashboard-tasks-panel-${selected}`} aria-labelledby={`dashboard-tasks-tab-${selected}`}>
        <SkillTaskList sections={ordered} sectionCode={selected === "ALL" ? undefined : selected}
          isPracticeUnlocked={unlocked} accessState={accessState} contentState={ready ? "ready" : contentState ?? "loading"}
          onStartIntent={onStart} progressEntries={entries}
          showGroupHeader={selected === "ALL"} showGroupProgress={false} />
      </div>
    </section>
  );
};

interface DashboardSidebarProps {
  entries: PracticeProgressEntry[];
  state: "loading" | "ready" | "error";
  taskName: (code: string) => string;
  organization?: string;
}

export const DashboardSidebar = ({ entries, state, taskName, organization }: DashboardSidebarProps): ReactElement => {
  const { t, locale } = useTranslation();
  const copy = DASHBOARD_COPY[locale];
  return (
    <aside className="dashboard-sidebar">
      <section className="dashboard-panel dashboard-plan">
        <span className="dashboard-plan-icon"><AppIcon name="calendar" size={26} /></span>
        <h2>{copy.plan}</h2><p>{copy.planHint}</p><ExamDateLine />
        {organization ? <div className="dashboard-organization"><AppIcon name="account" size={16} /><span>{organization}</span></div> : null}
      </section>
      <section className="dashboard-panel dashboard-activity" aria-busy={state === "loading"}>
        <h2>{copy.recent}</h2>
        {entries.length ? <ul>
          {entries.slice(0, DASHBOARD_RECENT_ITEMS).map((entry) => (
            <li key={entry.sessionPublicId}>
              <span className="dashboard-activity-dot" />
              <div><strong>{sessionDisplayName(entry, taskName, t)}</strong>
                <span>{entry.answeredItemCount}/{entry.totalItemCount} · {t(entry.status === "IN_PROGRESS" ? "progress.inProgress" : "progress.completed")}</span>
              </div>
            </li>
          ))}
        </ul> : state === "loading" ? <LoadingState compact message={copy.loading} />
          : <p>{state === "error" ? copy.error : copy.emptyHint}</p>}
        <Link className="text-link" href={PRACTICE_ROUTES.progress}>{copy.viewProgress}<AppIcon name="arrowRight" size={16} /></Link>
      </section>
    </aside>
  );
};
