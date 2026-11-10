"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { DASHBOARD_COPY } from "@/features/home/constants";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";

interface WorkspaceHeaderProps { resumeHref?: string }

export const WorkspaceHeader = ({ resumeHref }: WorkspaceHeaderProps): ReactElement => {
  const { catalog, catalogStatus } = usePractice();
  const { locale } = useTranslation();
  const copy = DASHBOARD_COPY[locale];
  const total = catalog.sections.reduce((sum, section) => sum + section.practiceQuestionCount, 0);
  const answered = catalog.sections.reduce((sum, section) => sum + section.answeredQuestionCount, 0);
  const ready = catalogStatus === "ready";
  return (
    <section className="dashboard-welcome" aria-labelledby="experience-title">
      <div className="dashboard-welcome-copy">
        <span className="dashboard-eyebrow"><AppIcon name="sparkle" size={16} />{copy.workspace}</span>
        <h1 id="experience-title">{copy.welcome}</h1><p>{copy.intro}</p>
        <div className="dashboard-welcome-actions">
          <Link className="button button-primary" href={resumeHref ?? `${PRACTICE_ROUTES.home}#dashboard-tasks-title`}>
            <AppIcon name="play" size={18} />{resumeHref ? copy.continue : copy.browse}
          </Link>
          <span className="dashboard-product">{catalog.title}</span>
        </div>
      </div>
      <div className="dashboard-summary" aria-busy={!ready}>
        <div><strong>{ready ? total : "—"}</strong><span>{copy.questions}</span></div>
        <div><strong>{ready ? answered : "—"}</strong><span>{copy.answered}</span></div>
      </div>
    </section>
  );
};
