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

export function HomeView() {
  const router = useRouter();
  const { catalog, entitlement, isPracticeUnlocked } = usePractice();
  const orderedTasks = flattenCatalogTasks(catalog.sections);
  const hasRunnableTask = isPracticeUnlocked && orderedTasks.some((task) => task.availability === "RUNNABLE");
  const recommendedTasks = [
    ...orderedTasks.filter((task) => task.availability === "RUNNABLE"),
    ...orderedTasks.filter((task) => task.availability === "VISIBLE"),
  ].slice(0, 2);
  const skillTiles = [
    { code: "SPEAKING", label: "Speaking", icon: "mic" as const },
    { code: "WRITING", label: "Writing", icon: "writing" as const },
    { code: "READING", label: "Reading", icon: "reading" as const },
    { code: "LISTENING", label: "Listening", icon: "listening" as const },
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
              <p><AppIcon name="calendar" size={16} /> Exam date: <strong>Not scheduled</strong></p>
            </div>
          </div>
          <div className="skill-matrix" aria-label="Practice skill status">
            {skillTiles.map((skill) => {
              const section = catalog.sections.find((item) => item.code === skill.code);
              const hasRunnableTask = section?.taskTypes.some(
                (task) => isPracticeUnlocked && canStartPractice("UNLOCKED", task),
              ) ?? false;
              const statusLabel = !isPracticeUnlocked
                ? UI_TEXT.lockedAction
                : hasRunnableTask
                  ? null
                  : UI_TEXT.unavailableAction;

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
              ? "Explore your practice areas. Practice actions unlock when access is confirmed."
              : hasRunnableTask
                ? "Your practice workspace is ready. Choose a skill to begin."
                : "Your practice access is active. Practice content is not ready yet."}
          </span>
        </div>
      </section>

      <section className="reference-section" aria-labelledby="recommended-title">
        <h2 id="recommended-title">Recommended for you</h2>
        {recommendedTasks.length > 0 ? (
          <div className="recommendation-row">
            {recommendedTasks.map((task) => {
              const canStart = isPracticeUnlocked && canStartPractice("UNLOCKED", task);
              const isUnavailable = task.availability !== "RUNNABLE";
              const statusLabel = !canStart && isUnavailable && isPracticeUnlocked
                ? UI_TEXT.unavailableAction
                : UI_TEXT.lockedAction;

              return (
                <article className="recommendation-card" key={task.code}>
                  <div className="recommendation-topline">
                    <span className="recommendation-icon" aria-hidden="true"><AppIcon name={iconForTaskType(task.code)} size={20} /></span>
                    {!canStart ? <LockBadge locked label={statusLabel} /> : null}
                  </div>
                  <h3>{catalog.title} {task.displayName}</h3>
                  <p>{task.scored ? "Review your results and personalized insights" : "Become familiar with the exam format"}</p>
                  <button className={`button${canStart ? " button-accent" : " button-muted"}`} type="button" disabled={!canStart} onClick={() => handleStartIntent(task)}>
                    <AppIcon name={canStart ? "play" : "lock"} size={15} />
                    {canStart ? UI_TEXT.availableAction : statusLabel}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="catalog-note">No practice task is available yet.</p>
        )}
      </section>

      <section className="reference-section" aria-labelledby="skills-title">
        <div className="section-heading-row"><h2 id="skills-title">Skills</h2><Link className="text-link" href={PRACTICE_ROUTES.practiceTests}>View all</Link></div>
        <SkillTaskList
          sections={catalog.sections}
          isPracticeUnlocked={isPracticeUnlocked}
          onStartIntent={handleStartIntent}
        />
      </section>

      {entitlement?.organizationContext ? (
        <p className="quiet-note">Workspace: {entitlement.organizationContext.displayName}</p>
      ) : null}
    </div>
  );
}
