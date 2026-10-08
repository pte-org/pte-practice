"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppIcon } from "@/common/components";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import type { PracticeProgress, PracticeProgressEntry } from "@/features/practice/contracts";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

type ProgressLoadState = "loading" | "ready" | "error";

const EMPTY_PROGRESS: PracticeProgress = {
  entries: [],
  totalSessions: 0,
  completedSessions: 0,
  answeredItems: 0,
  totalItems: 0,
  generatedAt: null,
  hasMore: false,
};

export function ProgressView() {
  const { authStatus, catalog } = usePractice();
  const { t } = useTranslation();
  const api = useMemo(() => createPracticeApiClient(), []);
  const [progress, setProgress] = useState<PracticeProgress>(EMPTY_PROGRESS);
  const [loadState, setLoadState] = useState<ProgressLoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setLoadState("loading");
    setError(null);
    try {
      setProgress(await api.getProgress());
      setLoadState("ready");
    } catch (reason) {
      setLoadState("error");
      setError(reason instanceof PracticeApiError && reason.message ? reason.message : t("ui.progressError"));
    }
  }, [api, authStatus, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProgress(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProgress]);

  const speaking = orderCatalogSections(catalog.sections).find((section) => section.code === "SPEAKING");
  const taskRows = speaking?.taskTypes.slice(0, 5) ?? [];
  const latest = progress.entries[0] ?? null;
  const metrics = [
    { label: t("ui.progressMetricSessions"), value: progress.totalSessions, icon: "responses" as const },
    { label: t("ui.progressMetricCompleted"), value: progress.completedSessions, icon: "check" as const },
    { label: t("ui.progressMetricResponses"), value: progress.answeredItems, icon: "writing" as const },
    { label: t("ui.progressMetricTasksReviewed"), value: progress.totalItems, icon: "reading" as const },
  ];

  return (
    <div className="page-stack" data-testid="progress-page">
      <AccessStatusBanner />
      <div className="progress-reference">
        <section className="reference-card progress-overview" aria-labelledby="progress-overview-title">
          <div className="progress-overview-header">
            <h1 id="progress-overview-title">{t("ui.progressHeading")}</h1>
            <p>{latest ? t("ui.progressLoadedDescription") : t("ui.progressEmptyDescription")}</p>
          </div>
          {loadState === "loading" ? <p className="progress-load-state" role="status">{t("ui.progressLoading")}</p> : null}
          {loadState === "error" ? (
            <div className="progress-error" role="alert">
              <span>{error ?? t("ui.progressError")}</span>
              <button className="text-button" type="button" onClick={() => void loadProgress()}>{t("common.tryAgain")}</button>
            </div>
          ) : null}
          <div className="metric-grid">
            {metrics.map((metric) => (
              <div className="metric-cell" key={metric.label}>
                <AppIcon name={metric.icon} size={21} />
                <span>{metric.label}</span>
                <strong className={progress.totalSessions ? "metric-value" : "metric-empty"}>{progress.totalSessions ? metric.value : t("ui.progressNoValue")}</strong>
              </div>
            ))}
          </div>
          <div className="insight-strip"><AppIcon name="sparkle" size={20} /><span>{latest ? progressStatusLabel(latest, t) : t("ui.progressEmptyDescription")}</span></div>
        </section>

        <section className="reference-section" aria-labelledby="progress-speaking-title">
          <h2 id="progress-speaking-title">{t("ui.progressSpeaking")}</h2>
          <div className="progress-section-card">
            <article className="progress-skill-card">
              <div className="progress-empty-ring" aria-hidden="true">{latest ? `${latest.answeredItemCount}/${latest.totalItemCount}` : t("ui.progressNoValue")}</div>
              <div><h3>{t("ui.progressSpeakingProficiency")}</h3><p>{latest ? progressStatusLabel(latest, t) : t("ui.progressCompleteTask")}</p></div>
            </article>
            <div className="skills-list">
              <div className="skill-list-row">
                <span className="skill-list-icon" aria-hidden="true"><AppIcon name="mic" size={19} /></span>
                <span className="skill-list-copy"><strong>{t("ui.progressSpeakingItems")}</strong><span>{taskRows.length ? `${taskRows.length} ${t("ui.progressTaskTypes")}` : t("ui.progressNoTaskTypes")}</span></span>
              </div>
              {taskRows.map((task) => (
                <div className="skill-list-row" key={task.code}>
                  <span className="skill-list-icon" aria-hidden="true"><AppIcon name={iconForTaskType(task.code)} size={17} /></span>
                  <span className="skill-list-copy"><strong>{task.displayName}</strong><span>{latest ? t("ui.progressSessionHistoryAvailable") : t("ui.progressNoResponse")}</span></span>
                  <span className="state-badge state-badge-locked">{t("ui.progressNoValue")}</span>
                  <span className="skill-list-action" aria-hidden="true"><AppIcon name="chevronRight" size={18} /></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {progress.entries.length ? <ProgressHistory entries={progress.entries} hasMore={progress.hasMore} t={t} /> : null}
        <p className="quiet-note">{t("ui.progressReadOnlyNote")}</p>
      </div>
    </div>
  );
}

function ProgressHistory({ entries, hasMore, t }: { entries: PracticeProgressEntry[]; hasMore: boolean; t: (k: TranslationKey) => string }) {
  return (
    <section className="progress-history" aria-labelledby="progress-history-title">
      <div className="progress-history-heading"><h2 id="progress-history-title">{t("ui.progressHistoryTitle")}</h2><span>{hasMore ? t("ui.progressLatestSessions") : `${entries.length} ${entries.length === 1 ? t("ui.progressSession") : t("ui.progressSessions")}`}</span></div>
      <div className="progress-history-list">
        {entries.map((entry) => (
          <article className="progress-history-row" key={entry.sessionPublicId}>
            <div><strong>{entry.title}</strong><span>{formatDate(entry.completedAt ?? entry.lastActivityAt ?? entry.startedAt, t)}</span></div>
            <div className="progress-history-stat"><span>{entry.answeredItemCount}/{entry.totalItemCount} {t("ui.progressResponses")}</span><span>{entry.highConfidenceCount} {t("ui.progressHighConfidence")}</span></div>
            <span className={`state-badge state-badge-${entry.status === "IN_PROGRESS" ? "locked" : "ready"}`}>{progressStatusLabel(entry, t)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function progressStatusLabel(entry: PracticeProgressEntry, t: (k: TranslationKey) => string): string {
  if (entry.status === "IN_PROGRESS") return t("ui.progressInProgress");
  if (entry.status === "COMPLETED_SCORED" && entry.score !== null) return `${t("ui.progressScore")}: ${entry.score}`;
  if (entry.status === "SCORING_FAILED") return t("ui.progressScoringUnavailable");
  return t("ui.progressNoScore");
}

function formatDate(value: string | null, t: (k: TranslationKey) => string): string {
  if (!value) return t("ui.progressNotStarted");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? t("ui.progressRecentActivity") : date.toLocaleDateString();
}
