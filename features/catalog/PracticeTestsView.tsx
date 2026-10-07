"use client";

import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { AppIcon } from "@/common/components";
import { usePractice } from "@/features/practice/PracticeProvider";
import { CatalogGrid } from "./CatalogGrid";

export function PracticeTestsView() {
  const { catalog, catalogStatus } = usePractice();

  return (
    <div className="page-stack" data-testid="practice-tests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Practice library</p>
          <h1>Practice tests</h1>
          <p>Choose a skill and work through focused PTE practice.</p>
        </div>
        <div className="page-heading-mark" aria-hidden="true"><AppIcon name="practice" size={25} /></div>
      </div>
      <AccessStatusBanner />
      {catalogStatus === "error" ? <p className="catalog-note" role="status">The catalog could not be refreshed. Showing a locked preview.</p> : null}
      <CatalogGrid sections={catalog.sections} />
    </div>
  );
}
