"use client";

import { useState, type ReactElement } from "react";
import { AppIcon, Skeleton, TabPanel, Tabs } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { iconForSection } from "@/features/practice/icon-mapping";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import { formatScore, skillKey, taskDisplayName } from "@/features/practice/presentation";
import { SkillTaskRow } from "@/features/practice/SkillTaskRow";
import { latestActiveTaskSession } from "@/features/practice/task-session";
import { HistorySection } from "./HistorySection";
import { progressMetrics } from "./progress-summary";
import { useWorkspaceProgress } from "@/features/workspace/WorkspaceProgressProvider";

export const ProgressView = (): ReactElement => {
  const { catalog, catalogStatus, isPracticeUnlocked, accessState } = usePractice();
  const { openFor, dialog } = usePracticeStart();
  const { t } = useTranslation();
  const { progress, status: loadState, refresh: loadProgress } = useWorkspaceProgress();
  const sections = orderCatalogSections(catalog.sections);
  const [skill, setSkill] = useState<string>(sections[0]?.code ?? "SPEAKING");

  const metrics = progressMetrics(progress);
  const taskName = (code: string) => {
    const found = sections.flatMap((section) => section.taskTypes).find((task) => task.code === code);
    return taskDisplayName(code, found?.displayName ?? code, t);
  };
  const cells = [
    { label: t("progress.metricSessions"), value: String(metrics.sessions), icon: "responses" as const },
    { label: t("progress.metricCompleted"), value: String(metrics.completed), icon: "check" as const },
    { label: t("progress.metricAnswered"), value: String(metrics.answered), icon: "writing" as const },
    { label: t("progress.metricAverage"), value: formatScore(metrics.averageScore), icon: "progress" as const },
  ];
  const current = sections.find((section) => section.code === skill) ?? sections[0];

  return (
    <div className="page-column" data-testid="progress-page">
      <h2 className="section-title">{t("progress.title")}</h2>
      {loadState === "error" ? (
        <div className="card progress-error" role="alert">
          <span>{t("progress.loadError")}</span>
          <button className="text-button" type="button" onClick={() => void loadProgress()}>{t("common.tryAgain")}</button>
        </div>
      ) : null}
      <div className="metric-grid" aria-busy={loadState === "loading"}>
        {cells.map((cell) => (
          <div className="card metric-card" key={cell.label}>
            <AppIcon name={cell.icon} size={20} />
            <span>{cell.label}</span>
            {loadState === "loading" ? <Skeleton variant="title" /> : <strong>{cell.value}</strong>}
          </div>
        ))}
      </div>

      <section className="home-section" aria-labelledby="by-skill-title">
        <h2 id="by-skill-title" className="section-title">{t("progress.bySkill")}</h2>
        <div className="card card-flush">
          <Tabs ariaLabel={t("progress.bySkill")} value={current?.code ?? ""} onChange={setSkill} variant="minimal"
            items={sections.map((section) => {
              const key = skillKey(section.code);
              return { id: section.code, label: key ? t(key) : section.displayName, icon: <AppIcon name={iconForSection(section.code)} size={16} /> };
            })} />
          {current ? (
            <TabPanel id={`progress-${current.code}`} active>
              {current.taskTypes.map((task) => {
                const activeSession = latestActiveTaskSession(progress.entries, task.code);
                const completedSession = progress.entries.find(
                  (entry) =>
                    entry.taskCode === task.code &&
                    (entry.status !== "IN_PROGRESS" && entry.sessionStatus !== "IN_PROGRESS"),
                );
                return (
                  <SkillTaskRow
                    key={task.code}
                    task={task}
                    isPracticeUnlocked={isPracticeUnlocked}
                    accessState={accessState}
                    contentState={catalogStatus === "ready" ? "ready" : catalogStatus === "error" ? "error" : "loading"}
                    activeSession={activeSession}
                    completedSession={completedSession}
                    onStart={openFor}
                  />
                );
              })}
            </TabPanel>
          ) : null}
        </div>
      </section>

      <HistorySection entries={progress.entries} ready={loadState === "ready"} taskName={taskName} />
      {dialog}
    </div>
  );
};
