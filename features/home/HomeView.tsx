"use client";

import type { ReactElement } from "react";
import { ErrorBanner } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useWorkspaceProgress } from "@/features/workspace/WorkspaceProgressProvider";
import { DashboardTaskTypes } from "./DashboardPanels";

export const HomeView = (): ReactElement => {
  const { openFor, dialog: modeDialog } = usePracticeStart();
  const { catalog, catalogStatus, isPracticeUnlocked, accessState } = usePractice();
  const { progress } = useWorkspaceProgress();
  const { t } = useTranslation();
  const dataReady = catalogStatus === "ready";

  return (
    <div className="dashboard-section" data-testid="home-page">
      <DashboardTaskTypes sections={catalog.sections} unlocked={isPracticeUnlocked}
        accessState={accessState} contentState={catalogStatus === "error" ? "error" : "loading"}
        ready={dataReady} entries={progress.entries} onStart={openFor} />
      {catalogStatus === "error" ? <ErrorBanner message={t("home.accessActiveContentNotReady")} /> : null}
      {!isPracticeUnlocked ? <p className="quiet-note">{t("home.explorePracticeAreas")}</p> : null}
      {modeDialog}
    </div>
  );
};
