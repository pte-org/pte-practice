"use client";

import { AppIcon, LockBadge } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { iconForSection } from "@/features/practice/icon-mapping";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import { orderCatalogSections } from "@/features/practice/catalog-order";
import { studySkillRows } from "./study-pack-rows";

export function StudyPackView() {
  const { catalog, catalogStatus, isPracticeUnlocked, accessState } = usePractice();
  const { openForSkill, dialog } = usePracticeStart();
  const { t } = useTranslation();
  const rows = studySkillRows(orderCatalogSections(catalog.sections), isPracticeUnlocked && catalogStatus === "ready");

  return (
    <div className="page-column" data-testid="study-pack-page">
      <h2 className="section-title">{rows.length} {t("studyPackView.skillsHeading")}</h2>
      <ul className="card card-flush study-skill-list">
        {rows.map((row) => {
          const name = t(`skills.${row.code.toLowerCase()}` as TranslationKey);
          return (
            <li className="study-skill-row" key={row.code}>
              <span className="study-skill-icon" aria-hidden="true">
                <AppIcon name={iconForSection(row.code)} size={22} />
              </span>
              <span className="study-skill-copy">
                <strong>{name}</strong>
                <span>
                  {row.total > 0
                    ? `${row.answered} ${t("studyPackView.answeredOf")} ${row.total} ${t("studyPackView.questionsAnswered")}`
                    : t("studyPackView.noQuestions")}
                </span>
              </span>
              {accessState === "locked" ? <LockBadge locked label={t("common.lockedAction")} /> : (
                <button className="button button-outline button-pill" type="button" disabled={!row.canStart}
                  aria-label={`${t("studyPackView.practice")} ${name}`}
                  onClick={() => openForSkill(row.section, name)}>
                  <AppIcon name="play" size={16} /> {t("studyPackView.practice")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {dialog}
    </div>
  );
}
