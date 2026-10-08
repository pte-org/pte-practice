"use client";

import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { AppIcon } from "@/common/components";
import { usePractice } from "@/features/practice/PracticeProvider";
import { CatalogGrid } from "./CatalogGrid";
import { useTranslation } from "@/common/i18n";

export function PracticeTestsView() {
  const { catalog, catalogStatus } = usePractice();
  const { t } = useTranslation();

  return (
    <div className="page-stack" data-testid="practice-tests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("catalog.practiceLibrary")}</p>
          <h1>{t("catalog.practiceTests")}</h1>
          <p>{t("catalog.catalogDescription")}</p>
        </div>
        <div className="page-heading-mark" aria-hidden="true"><AppIcon name="practice" size={25} /></div>
      </div>
      <AccessStatusBanner />
      {catalogStatus === "error" ? <p className="catalog-note" role="status">{t("catalog.catalogRefreshError")}</p> : null}
      <CatalogGrid sections={catalog.sections} />
    </div>
  );
}
