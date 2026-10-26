"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppIcon, TabPanel, Tabs } from "@/common/components";
import { useLatestRequest } from "@/common/hooks/useLatestRequest";
import { useTranslation } from "@/common/i18n";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import type { PracticeProgress } from "@/features/practice/contracts";
import { iconForSection } from "@/features/practice/icon-mapping";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import { formatScore, scoreTone, sessionDisplayName, skillKey, taskDisplayName } from "@/features/practice/presentation";
import { SkillTaskRow } from "@/features/practice/SkillTaskRow";
import { progressMetrics } from "./progress-summary";

type LoadState = "loading" | "ready" | "error";
const EMPTY: PracticeProgress = { entries: [], totalSessions: 0, completedSessions: 0, answeredItems: 0, totalItems: 0, generatedAt: null, hasMore: false };

export function ProgressView() {
  const { authStatus, catalog, isPracticeUnlocked } = usePractice();
  const { openFor, dialog } = usePracticeStart();
  const { t } = useTranslation();
  const api = useMemo(() => createPracticeApiClient(), []);
  const gate = useLatestRequest();
  const [progress, setProgress] = useState<PracticeProgress>(EMPTY);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const sections = orderCatalogSections(catalog.sections);
  const [skill, setSkill] = useState<string>(sections[0]?.code ?? "SPEAKING");

  const loadProgress = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    const id = gate.begin();
    setLoadState("loading");
    try {
      const loaded = await api.getProgress();
      if (!gate.isLatest(id)) return;
      setProgress(loaded);
      setLoadState("ready");
    } catch (reason) {
      if (!gate.isLatest(id)) return;
      setLoadState("error");
      setError(reason instanceof PracticeApiError && reason.message ? reason.message : t("progress.loadError"));
    }
  }, [api, authStatus, gate, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProgress(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProgress]);

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
      <h1 className="page-title">{t("progress.title")}</h1>
      {loadState === "error" ? (
        <div className="card progress-error" role="alert">
          <span>{error}</span>
          <button className="text-button" type="button" onClick={() => void loadProgress()}>{t("common.tryAgain")}</button>
        </div>
      ) : null}
      <div className="metric-grid" aria-busy={loadState === "loading"}>
        {cells.map((cell) => (
          <div className="card metric-card" key={cell.label}>
            <AppIcon name={cell.icon} size={20} />
            <span>{cell.label}</span>
            <strong>{loadState === "loading" ? "…" : cell.value}</strong>
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
                const activeSession = progress.entries.find(
                  (entry) =>
                    entry.taskCode === task.code &&
                    (entry.status === "IN_PROGRESS" || entry.sessionStatus === "IN_PROGRESS"),
                );
                return (
                  <SkillTaskRow
                    key={task.code}
                    task={task}
                    isPracticeUnlocked={isPracticeUnlocked}
                    activeSession={activeSession}
                    onStart={openFor}
                  />
                );
              })}
            </TabPanel>
          ) : null}
        </div>
      </section>

      <section className="home-section" aria-labelledby="history-title">
        <h2 id="history-title" className="section-title">{t("progress.history")}</h2>
        {loadState === "ready" && progress.entries.length === 0 ? <p className="catalog-note">{t("progress.empty")}</p> : null}
        {progress.entries.length ? (
          <ul className="card card-flush history-list">
            {progress.entries.map((entry) => {
              const inProgress = entry.status === "IN_PROGRESS" || entry.sessionStatus === "IN_PROGRESS";
              const targetUrl = inProgress
                ? `${PRACTICE_ROUTES.practiceSession}?sessionId=${entry.sessionPublicId}`
                : `${PRACTICE_ROUTES.practiceReview}?sessionId=${entry.sessionPublicId}`;
              return (
                <li className="history-row" key={entry.sessionPublicId}>
                  <Link className="history-copy history-row-link" href={targetUrl}>
                    <strong>{sessionDisplayName(entry, taskName, t)}</strong>
                    <span>{formatDate(entry.completedAt ?? entry.lastActivityAt ?? entry.startedAt)} · {entry.answeredItemCount}/{entry.totalItemCount} · {inProgress ? t("progress.inProgress") : t("progress.completed")}</span>
                  </Link>
                  {entry.score !== null && Number.isFinite(entry.score) ? (
                    <span className={`score-badge score-badge-${scoreTone(entry.score)}`}>{formatScore(entry.score)}</span>
                  ) : null}
                  <Link className="button button-outline button-pill" href={targetUrl}>
                    {inProgress ? t("progress.resume") : t("progress.review")}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
      {dialog}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
