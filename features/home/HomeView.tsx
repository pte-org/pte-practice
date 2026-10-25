"use client";

import Link from "next/link";
import { AppIcon, LockBadge, ProductMark, ProgressRing } from "@/common/components";
import { SkillTaskList } from "@/features/catalog/SkillTaskList";
import { flattenCatalogTasks } from "@/features/practice/catalog-order";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { canStartPractice } from "@/features/practice/contracts";
import { iconForTaskType } from "@/features/practice/icon-mapping";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useTranslation } from "@/common/i18n";
import { useState } from "react";
import { SKILL_DEVICE_CHECK, type DeviceCheckKind } from "@/features/deviceCheck/device-check";
import { DeviceCheckDialog } from "@/features/deviceCheck/DeviceCheckDialog";
import { useDeviceChecks } from "@/features/deviceCheck/useDeviceChecks";
import { ExamDateLine } from "./ExamDateLine";

const CHECK_LABELS = {
  mic: "deviceCheck.micTile",
  speaker: "deviceCheck.speakerTile",
  keyboard: "deviceCheck.keyboardTile",
  reading: "deviceCheck.readingTile",
} as const;

export function HomeView() {
  const { openFor: handleStartIntent, dialog: modeDialog } = usePracticeStart();
  const { catalog, entitlement, isPracticeUnlocked } = usePractice();
  const { t } = useTranslation();
  const { passed, markPassed } = useDeviceChecks();
  const [check, setCheck] = useState<DeviceCheckKind | null>(null);
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


  return (
    <div className="page-stack" data-testid="home-page">
      <section className="reference-card experience-card" aria-labelledby="experience-title">
        <div className="experience-header">
          <div className="experience-identity">
            <div className="experience-ring" aria-hidden="true"><ProductMark /></div>
            <div>
              <h1 id="experience-title">{catalog.title}</h1>
              <ExamDateLine />
            </div>
          </div>
          {/* Each skill tile opens the device check that skill depends on (mic, speakers, keyboard, text size). */}
          <div className="skill-matrix" aria-label={t("deviceCheck.micTitle")}>
            {skillTiles.map((skill) => {
              const kind = SKILL_DEVICE_CHECK[skill.code];
              const checked = passed(kind);
              return (
                <button className="skill-tile skill-tile-check" type="button" key={skill.code} onClick={() => setCheck(kind)}>
                  <ProgressRing variant={checked ? "progress" : "empty"} value={checked ? 1 : 0} max={1} tone="green" size={48}
                    label={`${skill.label}: ${checked ? t("deviceCheck.checked") : t("deviceCheck.notChecked")}`}>
                    <AppIcon name={skill.icon} size={24} />
                  </ProgressRing>
                  <strong>{skill.label}</strong>
                  <span>{t(CHECK_LABELS[kind])}</span>
                  <span className={checked ? "device-status-ok" : "device-status-todo"}>
                    {checked ? `✓ ${t("deviceCheck.checked")}` : t("deviceCheck.notChecked")}
                  </span>
                </button>
              );
            })}
          </div>
          <DeviceCheckDialog kind={check} onClose={() => setCheck(null)} onPassed={markPassed} />
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
      {modeDialog}
    </div>
  );
}
