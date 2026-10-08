"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppIcon } from "@/common/components";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { createPracticeApiClient, PracticeApiError } from "@/features/practice/api";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { UI_TEXT } from "@/features/practice/constants";
import type { PracticeProgress, PracticeProgressEntry } from "@/features/practice/contracts";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import { usePractice } from "@/features/practice/PracticeProvider";

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
      setError(reason instanceof PracticeApiError && reason.message ? reason.message : UI_TEXT.progressError);
    }
  }, [api, authStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProgress(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProgress]);

  const speaking = orderCatalogSections(catalog.sections).find((section) => section.code === "SPEAKING");
  const taskRows = speaking?.taskTypes.slice(0, 5) ?? [];
  const latest = progress.entries[0] ?? null;
  const metrics = [
    { label: UI_TEXT.progressMetricSessions, value: progress.totalSessions, icon: "responses" as const },
    { label: UI_TEXT.progressMetricCompleted, value: progress.completedSessions, icon: "check" as const },
    { label: UI_TEXT.progressMetricResponses, value: progress.answeredItems, icon: "writing" as const },
    { label: UI_TEXT.progressMetricTasksReviewed, value: progress.totalItems, icon: "reading" as const },
  ];

  return (
    <div className="page-stack" data-testid="progress-page">
      <AccessStatusBanner />
      <div className="progress-reference">
        <section className="reference-card progress-overview" aria-labelledby="progress-overview-title">
          <div className="progress-overview-header">
            <h1 id="progress-overview-title">{UI_TEXT.progressHeading}</h1>
            <p>{latest ? UI_TEXT.progressLoadedDescription : UI_TEXT.progressEmptyDescription}</p>
          </div>
          {loadState === "loading" ? <p className="progress-load-state" role="status">{UI_TEXT.progressLoading}</p> : null}
          {loadState === "error" ? (
            <div className="progress-error" role="alert">
              <span>{error ?? UI_TEXT.progressError}</span>
              <button className="text-button" type="button" onClick={() => void loadProgress()}>{UI_TEXT.tryAgain}</button>
            </div>
          ) : null}
          <div className="metric-grid">
            {metrics.map((metric) => (
              <div className="metric-cell" key={metric.label}>
                <AppIcon name={metric.icon} size={21} />
                <span>{metric.label}</span>
                <strong className={progress.totalSessions ? "metric-value" : "metric-empty"}>{progress.totalSessions ? metric.value : UI_TEXT.progressNoValue}</strong>
              </div>
            ))}
          </div>
          <div className="insight-strip"><AppIcon name="sparkle" size={20} /><span>{latest ? progressStatusLabel(latest) : UI_TEXT.progressEmptyDescription}</span></div>
        </section>

        <section className="reference-section" aria-labelledby="progress-speaking-title">
          <h2 id="progress-speaking-title">{UI_TEXT.progressSpeaking}</h2>
          <div className="progress-section-card">
            <article className="progress-skill-card">
              <div className="progress-empty-ring" aria-hidden="true">{latest ? `${latest.answeredItemCount}/${latest.totalItemCount}` : UI_TEXT.progressNoValue}</div>
              <div><h3>{UI_TEXT.progressSpeakingProficiency}</h3><p>{latest ? progressStatusLabel(latest) : UI_TEXT.progressCompleteTask}</p></div>
            </article>
            <div className="skills-list">
              <div className="skill-list-row">
                <span className="skill-list-icon" aria-hidden="true"><AppIcon name="mic" size={19} /></span>
                <span className="skill-list-copy"><strong>{UI_TEXT.progressSpeakingItems}</strong><span>{taskRows.length ? `${taskRows.length} ${UI_TEXT.progressTaskTypes}` : UI_TEXT.progressNoTaskTypes}</span></span>
              </div>
              {taskRows.map((task) => (
                <div className="skill-list-row" key={task.code}>
                  <span className="skill-list-icon" aria-hidden="true"><AppIcon name={iconForTaskType(task.code)} size={17} /></span>
                  <span className="skill-list-copy"><strong>{task.displayName}</strong><span>{latest ? UI_TEXT.progressSessionHistoryAvailable : UI_TEXT.progressNoResponse}</span></span>
                  <span className="state-badge state-badge-locked">{UI_TEXT.progressNoValue}</span>
                  <span className="skill-list-action" aria-hidden="true"><AppIcon name="chevronRight" size={18} /></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {progress.entries.length ? <ProgressHistory entries={progress.entries} hasMore={progress.hasMore} /> : null}
        <p className="quiet-note">{UI_TEXT.progressReadOnlyNote}</p>
      </div>
    </div>
  );
}

function ProgressHistory({ entries, hasMore }: { entries: PracticeProgressEntry[]; hasMore: boolean }) {
  return (
    <section className="progress-history" aria-labelledby="progress-history-title">
      <div className="progress-history-heading"><h2 id="progress-history-title">{UI_TEXT.progressHistoryTitle}</h2><span>{hasMore ? UI_TEXT.progressLatestSessions : `${entries.length} ${entries.length === 1 ? UI_TEXT.progressSession : UI_TEXT.progressSessions}`}</span></div>
      <div className="progress-history-list">
        {entries.map((entry) => (
          <article className="progress-history-row" key={entry.sessionPublicId}>
            <div><strong>{entry.title}</strong><span>{formatDate(entry.completedAt ?? entry.lastActivityAt ?? entry.startedAt)}</span></div>
            <div className="progress-history-stat"><span>{entry.answeredItemCount}/{entry.totalItemCount} {UI_TEXT.progressResponses}</span><span>{entry.highConfidenceCount} {UI_TEXT.progressHighConfidence}</span></div>
            <span className={`state-badge state-badge-${entry.status === "IN_PROGRESS" ? "locked" : "ready"}`}>{progressStatusLabel(entry)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function progressStatusLabel(entry: PracticeProgressEntry): string {
  if (entry.status === "IN_PROGRESS") return UI_TEXT.progressInProgress;
  if (entry.status === "COMPLETED_SCORED" && entry.score !== null) return `${UI_TEXT.progressScore}: ${entry.score}`;
  if (entry.status === "SCORING_FAILED") return UI_TEXT.progressScoringUnavailable;
  return UI_TEXT.progressNoScore;
}

function formatDate(value: string | null): string {
  if (!value) return UI_TEXT.progressNotStarted;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? UI_TEXT.progressRecentActivity : date.toLocaleDateString();
}
