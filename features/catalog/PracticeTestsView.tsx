"use client";

import { AppIcon } from "@/common/components";
import { MockTestListView } from "@/features/mockTests/MockTestListView";
import { useTranslation } from "@/common/i18n";

export function PracticeTestsView() {
  const { t } = useTranslation();

  return (
    <div className="page-stack" data-testid="practice-tests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("catalog.practiceLibrary")}</p>
          <h1>{t("catalog.practiceTests")}</h1>
        </div>
        <div className="page-heading-mark" aria-hidden="true"><AppIcon name="practice" size={25} /></div>
      </div>
      <MockTestListView />
    </div>
  );
}
