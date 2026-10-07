"use client";

import { useState } from "react";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { CatalogCard } from "./CatalogCard";
import { UI_TEXT } from "@/features/practice/constants";
import type { PracticeCatalogTask, PracticeCatalogSection } from "@/features/practice/contracts";
import { usePractice } from "@/features/practice/PracticeProvider";

interface CatalogGridProps {
  sections: PracticeCatalogSection[];
  compact?: boolean;
}

export function CatalogGrid({ sections, compact = false }: CatalogGridProps) {
  const { isPracticeUnlocked, refreshEntitlement } = usePractice();
  const [notice, setNotice] = useState<string | null>(null);
  const orderedSections = orderCatalogSections(sections);
  const visibleSections = compact ? orderedSections.slice(0, 3) : orderedSections;

  function handleStartIntent(task: PracticeCatalogTask) {
    if (!isPracticeUnlocked) return;
    setNotice(`${task.displayName} is ready. ${UI_TEXT.sessionPlaceholder}`);
    void refreshEntitlement();
  }

  return (
    <div className="catalog-list">
      {notice ? <p className="inline-notice" role="status">{notice}</p> : null}
      {visibleSections.map((section) => (
        <section className="catalog-section" key={section.code}>
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{section.code}</p>
              <h2>{section.displayName}</h2>
            </div>
            <span className="section-count">{section.taskTypes.length} task types</span>
          </div>
          <div className="catalog-grid">
            {section.taskTypes.map((task) => (
              <CatalogCard
                key={task.code}
                task={task}
                isPracticeUnlocked={isPracticeUnlocked}
                onStartIntent={handleStartIntent}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
