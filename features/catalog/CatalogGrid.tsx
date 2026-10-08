"use client";

import { useRouter } from "next/navigation";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { CatalogCard } from "./CatalogCard";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import type { PracticeCatalogTask, PracticeCatalogSection } from "@/features/practice/contracts";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

interface CatalogGridProps {
  sections: PracticeCatalogSection[];
  compact?: boolean;
}

export function CatalogGrid({ sections, compact = false }: CatalogGridProps) {
  const router = useRouter();
  const { isPracticeUnlocked } = usePractice();
  const { t } = useTranslation();
  const orderedSections = orderCatalogSections(sections);
  const visibleSections = compact ? orderedSections.slice(0, 3) : orderedSections;

  function handleStartIntent(task: PracticeCatalogTask) {
    if (!isPracticeUnlocked) return;
    router.push(`${PRACTICE_ROUTES.practiceSession}?task=${encodeURIComponent(task.code)}`);
  }

  return (
    <div className="catalog-list">
      {visibleSections.map((section) => (
        <section className="catalog-section" key={section.code}>
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{section.code}</p>
              <h2>{t(`skills.${section.code.toLowerCase()}` as TranslationKey) || section.displayName}</h2>
            </div>
            <span className="section-count">{section.taskTypes.length} {t("catalog.taskTypes")}</span>
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
