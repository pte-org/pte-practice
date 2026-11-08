"use client";

import type { ReactElement } from "react";
import { MockTestListView } from "@/features/mockTests/MockTestListView";
import { useTranslation } from "@/common/i18n";

export const PracticeTestsView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <section className="dashboard-section" data-testid="practice-tests-page" aria-labelledby="practice-tests-title">
      <div className="dashboard-section-heading"><h2 id="practice-tests-title">{t("catalog.practiceTests")}</h2></div>
      <MockTestListView />
    </section>
  );
};
