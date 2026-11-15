"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { CollapsibleSection, Tabs } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import type { PracticeProgressEntry } from "@/features/practice/contracts";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { reviewHref } from "@/features/practice/review-return";
import { formatScore, scoreTone, sessionDisplayName } from "@/features/practice/presentation";
import {
  HISTORY_FILTERS, HISTORY_PAGE_SIZE, historyFilterCounts, isEntryInProgress, matchesHistoryFilter, type HistoryFilter,
} from "./history-filter";

const FILTER_LABELS: Record<HistoryFilter, TranslationKey> = {
  ALL: "progress.historyFilterAll",
  IN_PROGRESS: "progress.historyFilterInProgress",
  COMPLETED: "progress.historyFilterCompleted",
  AWAITING_SCORE: "progress.historyFilterAwaitingScore",
};

interface HistorySectionProps {
  entries: readonly PracticeProgressEntry[];
  ready: boolean;
  taskName: (code: string) => string;
}

export const HistorySection = ({ entries, ready, taskName }: HistorySectionProps): ReactElement => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<HistoryFilter>("ALL");
  const [limit, setLimit] = useState(HISTORY_PAGE_SIZE);
  const counts = historyFilterCounts(entries);
  const visible = entries.filter((entry) => matchesHistoryFilter(entry, filter));
  const changeFilter = (next: string): void => {
    setFilter(next as HistoryFilter);
    setLimit(HISTORY_PAGE_SIZE);
  };

  return (
    <CollapsibleSection title={t("progress.history")} className="home-section history-section">
      {ready && entries.length === 0 ? <p className="catalog-note">{t("progress.empty")}</p> : null}
      {entries.length ? (
        <>
          <Tabs ariaLabel={t("progress.history")} value={filter} onChange={changeFilter} variant="minimal"
            className="history-filters"
            items={HISTORY_FILTERS.map((id) => ({ id, label: t(FILTER_LABELS[id]), count: counts[id] }))} />
          {visible.length === 0 ? <p className="catalog-note">{t("progress.historyFilterEmpty")}</p> : (
            <ul className="card card-flush history-list">
              {visible.slice(0, limit).map((entry) => (
                <HistoryRow key={entry.sessionPublicId} entry={entry} taskName={taskName} />
              ))}
            </ul>
          )}
          {visible.length > limit ? (
            <button type="button" className="button button-outline button-pill history-more"
              onClick={() => setLimit((current) => current + HISTORY_PAGE_SIZE)}>
              {t("progress.historyShowMore")} ({visible.length - limit})
            </button>
          ) : null}
        </>
      ) : null}
    </CollapsibleSection>
  );
};

const HistoryRow = ({ entry, taskName }: { entry: PracticeProgressEntry; taskName: (code: string) => string }): ReactElement => {
  const { t } = useTranslation();
  const inProgress = isEntryInProgress(entry);
  const targetUrl = inProgress
    ? `${PRACTICE_ROUTES.practiceSession}?sessionId=${entry.sessionPublicId}`
    : reviewHref(entry.sessionPublicId, PRACTICE_ROUTES.progress);
  const badges: Array<{ key: string; tone: string; text: string }> = [];
  if (entry.scoringCount > 0) badges.push({ key: "scoring", tone: "info", text: t("progress.historyScoring").replace("{count}", String(entry.scoringCount)) });
  if (entry.scoringFailedCount > 0) badges.push({ key: "failed", tone: "error", text: t("progress.historyScoringFailed").replace("{count}", String(entry.scoringFailedCount)) });
  if (entry.unscoredAiCount > 0) badges.push({ key: "unscored", tone: "warn", text: t("progress.historyUnscored").replace("{count}", String(entry.unscoredAiCount)) });

  return (
    <li className="history-row">
      <Link className="history-copy history-row-link" href={targetUrl}>
        <strong>{sessionDisplayName(entry, taskName, t)}</strong>
        <span>{formatDate(entry.completedAt ?? entry.lastActivityAt ?? entry.startedAt)} · {entry.answeredItemCount}/{entry.totalItemCount} · {inProgress ? t("progress.inProgress") : t("progress.completed")}</span>
      </Link>
      {badges.map((badge) => <span key={badge.key} className={`history-scoring history-scoring-${badge.tone}`}>{badge.text}</span>)}
      {entry.score !== null && Number.isFinite(entry.score) ? (
        <span className={`score-badge score-badge-${scoreTone(entry.score)}`}>{formatScore(entry.score)}</span>
      ) : null}
      <Link className="button button-outline button-pill" href={targetUrl}>
        {inProgress ? t("progress.resume") : t("progress.review")}
      </Link>
    </li>
  );
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
