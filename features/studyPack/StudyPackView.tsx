"use client";

import { AppIcon, LockBadge } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { iconForSection } from "@/features/practice/icon-mapping";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { usePractice } from "@/features/practice/PracticeProvider";
import { studySkillRows, totalPracticeQuestions } from "./study-pack-rows";

export function StudyPackView() {
  const { catalog, isPracticeUnlocked } = usePractice();
  const { openForSkill, dialog } = usePracticeStart();
  const { t } = useTranslation();
  const rows = studySkillRows(catalog.sections, isPracticeUnlocked);
  const total = totalPracticeQuestions(rows);

  return (
    <div className="study-pack" data-testid="study-pack-page">
      <AccessStatusBanner />
      <div className="study-pack-summary">
        <AppIcon name="sparkle" size={22} />
        <div>
          <strong>{total} {t("studyPackView.summaryTitle")}</strong>
          <p>{t("studyPackView.summaryHint")}</p>
        </div>
      </div>
      <h2 className="study-pack-heading">{rows.length} {t("studyPackView.skillsHeading")}</h2>
      <ul className="study-skill-list">
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
              {!isPracticeUnlocked ? <LockBadge locked label={t("common.lockedAction")} /> : (
                <button className="button button-primary button-pill" type="button" disabled={!row.canStart}
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
