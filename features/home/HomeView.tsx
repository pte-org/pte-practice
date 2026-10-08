"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppIcon, LockBadge, ProductMark } from "@/common/components";
import { SkillTaskList } from "@/features/catalog/SkillTaskList";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { flattenCatalogTasks } from "@/features/practice/catalog-order";
import { PRACTICE_ROUTES, UI_TEXT } from "@/features/practice/constants";
import { canStartPractice, type PracticeCatalogTask } from "@/features/practice/contracts";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

export function HomeView() {
  const router = useRouter();
  const { catalog, entitlement, isPracticeUnlocked } = usePractice();
  const { t } = useTranslation();
  const orderedTasks = flattenCatalogTasks(catalog.sections);
  const hasRunnableTask = isPracticeUnlocked && orderedTasks.some((task) => task.availability === "RUNNABLE");
  const recommendedTasks = [
    ...orderedTasks.filter((task) => task.availability === "RUNNABLE"),
    ...orderedTasks.filter((task) => task.availability === "VISIBLE"),
  ].slice(0, 2);
  const skillTiles = [
    { code: "SPEAKING", label: t("skills.speaking"), icon: "mic" as const },
    { code: "WRITING", label: t("skills.writing"), icon: "writing" as const },
    { code: "READING", label: t("skills.reading"), icon: "reading" as const },
    { code: "LISTENING", label: t("skills.listening"), icon: "listening" as const },
  ];

  function handleStartIntent(task: PracticeCatalogTask) {
    if (!isPracticeUnlocked || !canStartPractice("UNLOCKED", task)) return;
    router.push(`${PRACTICE_ROUTES.practiceSession}?task=${encodeURIComponent(task.code)}`);
  }

  return (
    <div className="page-stack" data-testid="home-page">
      <AccessStatusBanner />

      <section className="reference-card experience-card" aria-labelledby="experience-title">
        <div className="experience-header">
          <div className="experience-identity">
            <div className="experience-ring" aria-hidden="true"><ProductMark /></div>
            <div>
              <h1 id="experience-title">{catalog.title}</h1>
              <p><AppIcon name="calendar" size={16} /> {t("home.examDate")} <strong>{t("home.notScheduled")}</strong></p>
            </div>
          </div>
          <div className="skill-matrix" aria-label="Practice skill status">
            {skillTiles.map((skill) => {
              const section = catalog.sections.find((item) => item.code === skill.code);
              const hasRunnableTask = section?.taskTypes.some(
                (task) => isPracticeUnlocked && canStartPractice("UNLOCKED", task),
              ) ?? false;
              const statusLabel = !isPracticeUnlocked
                ? t("common.lockedAction")
                : hasRunnableTask
                  ? null
                  : t("common.unavailableAction");

              return (
                <div className="skill-tile" key={skill.code}>
                  <AppIcon name={skill.icon} size={22} />
                  <strong>{skill.label}</strong>
                  {statusLabel ? <span>{statusLabel}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="insight-strip">
          <AppIcon name="sparkle" size={20} />
          <span>
            {!isPracticeUnlocked
              ? t("home.explorePracticeAreas")
              : hasRunnableTask
                ? t("home.workspaceReady")
                : t("home.accessActiveContentNotReady")}
          </span>
        </div>
      </section>

      <section className="reference-section" aria-labelledby="recommended-title">
        <h2 id="recommended-title">{t("home.recommendedForYou")}</h2>
        {recommendedTasks.length > 0 ? (
          <div className="recommendation-row">
            {recommendedTasks.map((task) => {
              const canStart = isPracticeUnlocked && canStartPractice("UNLOCKED", task);
              const isUnavailable = task.availability !== "RUNNABLE";
              const statusLabel = !canStart && isUnavailable && isPracticeUnlocked
                ? t("common.unavailableAction")
                : t("common.lockedAction");

              return (
                <article className="recommendation-card" key={task.code}>
                  <div className="recommendation-topline">
                    <span className="recommendation-icon" aria-hidden="true"><AppIcon name={iconForTaskType(task.code)} size={20} /></span>
                    {!canStart ? <LockBadge locked label={statusLabel} /> : null}
                  </div>
                  <h3>{catalog.title} {task.displayName}</h3>
                  <p>{task.scored ? t("home.reviewResultsInsights") : t("home.familiarizeExamFormat")}</p>
                  <button className={`button${canStart ? " button-accent" : " button-muted"}`} type="button" disabled={!canStart} onClick={() => handleStartIntent(task)}>
                    <AppIcon name={canStart ? "play" : "lock"} size={15} />
                    {canStart ? t("ui.availableAction") : statusLabel}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="catalog-note">{t("home.noPracticeTaskAvailable")}</p>
        )}
      </section>

      <section className="reference-section" aria-labelledby="skills-title">
        <div className="section-heading-row"><h2 id="skills-title">{t("home.skills")}</h2><Link className="text-link" href={PRACTICE_ROUTES.practiceTests}>{t("home.viewAll")}</Link></div>
        <SkillTaskList
          sections={catalog.sections}
          isPracticeUnlocked={isPracticeUnlocked}
          onStartIntent={handleStartIntent}
        />
      </section>

      {entitlement?.organizationContext ? (
        <p className="quiet-note">{t("home.workspace")} {entitlement.organizationContext.displayName}</p>
      ) : null}
    </div>
  );
}
