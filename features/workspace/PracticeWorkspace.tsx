"use client";

import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { WorkspaceLayout } from "@/common/components/WorkspaceLayout";
import { useTranslation } from "@/common/i18n";
import { DashboardRecommendations, DashboardSidebar } from "@/features/home/DashboardPanels";
import { buildTaskRecommendations } from "@/features/home/recommendations";
import { flattenCatalogTasks } from "@/features/practice/catalog-order";
import { taskDisplayName } from "@/features/practice/presentation";
import { usePractice } from "@/features/practice/PracticeProvider";
import { isWorkspaceRoute } from "./constants";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceProgressProvider, useWorkspaceProgress } from "./WorkspaceProgressProvider";
import "@/features/home/dashboard.css";

interface PracticeWorkspaceProps { children: ReactNode }

const PracticeWorkspace = ({ children }: PracticeWorkspaceProps): ReactElement => {
  const { catalog, entitlement, isPracticeUnlocked } = usePractice();
  const { progress, status } = useWorkspaceProgress();
  const { t } = useTranslation();
  const tasks = flattenCatalogTasks(catalog.sections);
  const taskName = (code: string): string => taskDisplayName(code, tasks.find((task) => task.code === code)?.displayName ?? code, t);
  const cards = isPracticeUnlocked ? buildTaskRecommendations(progress.entries, taskName, t) : [];
  const resume = cards[0];
  return (
    <WorkspaceLayout className="learning-dashboard"
      header={<WorkspaceHeader resumeHref={resume?.target.type === "href" ? resume.target.href : undefined} />}
      beforeContent={<DashboardRecommendations cards={cards} sections={catalog.sections} state={status} />}
      sidebar={<DashboardSidebar entries={progress.entries} state={status} taskName={taskName}
        organization={entitlement?.organizationContext?.displayName} />}>
      {children}
    </WorkspaceLayout>
  );
};

/** Mounted outside changing page segments; exam delivery/review never receive dashboard chrome. */
export const PracticeWorkspaceBoundary = ({ children }: PracticeWorkspaceProps): ReactElement => {
  const pathname = usePathname();
  if (!isWorkspaceRoute(pathname)) return <>{children}</>;
  return <WorkspaceProgressProvider><PracticeWorkspace>{children}</PracticeWorkspace></WorkspaceProgressProvider>;
};
