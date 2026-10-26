"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppIcon, ProductMark } from "@/common/components";
import { useLatestRequest } from "@/common/hooks/useLatestRequest";
import { useTranslation } from "@/common/i18n";
import { SkillTaskList } from "@/features/catalog/SkillTaskList";
import { SKILL_DEVICE_CHECK, type DeviceCheckKind } from "@/features/deviceCheck/device-check";
import { DeviceCheckDialog } from "@/features/deviceCheck/DeviceCheckDialog";
import { useDeviceChecks } from "@/features/deviceCheck/useDeviceChecks";
import type { MockTest } from "@/features/mockTests/mock-test-contracts";
import { createPracticeApiClient } from "@/features/practice/api";
import { flattenCatalogTasks } from "@/features/practice/catalog-order";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import type { PracticeProgressEntry } from "@/features/practice/contracts";
import { mockTarget } from "@/features/practice/mode/mode-target";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { taskDisplayName } from "@/features/practice/presentation";
import { usePractice } from "@/features/practice/PracticeProvider";
import { ExamDateLine } from "./ExamDateLine";
import { RecommendationCarousel } from "./RecommendationCarousel";
import { buildRecommendations } from "./recommendations";

const SKILL_TILES = [
  { code: "SPEAKING", label: "skills.speaking", icon: "mic" },
  { code: "WRITING", label: "skills.writing", icon: "writing" },
  { code: "READING", label: "skills.reading", icon: "reading" },
  { code: "LISTENING", label: "skills.listening", icon: "listening" },
] as const;

export function HomeView() {
  const { openFor, openForMock, dialog: modeDialog } = usePracticeStart();
  const { catalog, entitlement, isPracticeUnlocked, authStatus } = usePractice();
  const { t } = useTranslation();
  const { passed, markPassed } = useDeviceChecks();
  const [check, setCheck] = useState<DeviceCheckKind | null>(null);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [entries, setEntries] = useState<PracticeProgressEntry[]>([]);
  const api = useMemo(() => createPracticeApiClient(), []);
  const gate = useLatestRequest();
  const tasks = flattenCatalogTasks(catalog.sections);
  const hasRunnableTask = isPracticeUnlocked && tasks.some((task) => task.availability === "RUNNABLE");

  // Mock tests and unfinished sessions feed "Recommended for you"; a failure just leaves the row empty.
  useEffect(() => {
    if (authStatus !== "authenticated" || !isPracticeUnlocked) return;
    const id = gate.begin();
    void Promise.all([api.listMockTests().catch(() => []), api.getProgress().then((p) => p.entries).catch(() => [])])
      .then(([tests, progressEntries]) => {
        if (!gate.isLatest(id)) return;
        setMockTests(tests);
        setEntries(progressEntries);
      });
  }, [api, authStatus, gate, isPracticeUnlocked]);

  const taskName = (code: string) => {
    const found = tasks.find((task) => task.code === code);
    return taskDisplayName(code, found?.displayName ?? code, t);
  };
  const cards = buildRecommendations(mockTests, entries, taskName, t);

  return (
    <div className="page-column" data-testid="home-page">
      <section className="card home-hero" aria-labelledby="experience-title">
        <div className="home-hero-top">
          <div className="home-identity">
            <div className="home-logo-ring" aria-hidden="true"><ProductMark /></div>
            <div>
              <h1 id="experience-title">{catalog.title}</h1>
              <ExamDateLine />
            </div>
          </div>
          {/* Each skill tile opens the device check that skill depends on (mic, speakers, keyboard, text size). */}
          <div className="device-grid">
            {SKILL_TILES.map((skill) => {
              const kind = SKILL_DEVICE_CHECK[skill.code];
              const checked = passed(kind);
              return (
                <button className="device-tile" type="button" key={skill.code} onClick={() => setCheck(kind)}>
                  <AppIcon name={skill.icon} size={22} />
                  <span>{t(skill.label)}</span>
                  <strong className={checked ? "device-status-ok" : "device-status-todo"}>
                    {checked ? `✓ ${t("deviceCheck.checked")}` : t("deviceCheck.notChecked")}
                  </strong>
                </button>
              );
            })}
          </div>
        </div>
        <div className="hint-strip">
          <AppIcon name="sparkle" size={20} />
          <span>
            {!isPracticeUnlocked ? t("home.explorePracticeAreas")
              : hasRunnableTask ? t("home.workspaceReady") : t("home.accessActiveContentNotReady")}
          </span>
        </div>
      </section>

      <section aria-labelledby="recommended-title" className="home-section">
        {cards.length > 0 ? (
          <RecommendationCarousel
            title={<h2 id="recommended-title" className="section-title">{t("presentation.recommended")}</h2>}
            cards={cards}
            onStartMock={(publicId, title) => openForMock(mockTarget(publicId, title))}
          />
        ) : (
          <>
            <div className="section-heading-row">
              <h2 id="recommended-title" className="section-title">{t("presentation.recommended")}</h2>
            </div>
            <p className="catalog-note">{t("home.noPracticeTaskAvailable")}</p>
          </>
        )}
      </section>

      <section aria-labelledby="skills-title" className="home-section">
        <div className="section-heading-row">
          <h2 id="skills-title" className="section-title">{t("presentation.skills")}</h2>
          <Link className="text-link" href={PRACTICE_ROUTES.studyPack}>{t("presentation.viewAll")}</Link>
        </div>
        <SkillTaskList
          sections={catalog.sections}
          isPracticeUnlocked={isPracticeUnlocked}
          onStartIntent={openFor}
          progressEntries={entries}
        />
      </section>

      {entitlement?.organizationContext ? (
        <p className="quiet-note">{t("home.workspace")} {entitlement.organizationContext.displayName}</p>
      ) : null}
      <DeviceCheckDialog kind={check} onClose={() => setCheck(null)} onPassed={markPassed} />
      {modeDialog}
    </div>
  );
}
