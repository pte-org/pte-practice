"use client";

import { useRouter } from "next/navigation";
import { AppIcon, type IconName } from "@/common/components";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { LockBadge } from "@/common/components";
import { PRACTICE_ROUTES, STUDY_PACKS } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

export function StudyPackView() {
  const router = useRouter();
  const { isPracticeUnlocked } = usePractice();
  const { t } = useTranslation();

  return (
    <div className="page-stack" data-testid="study-pack-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("studyPackView.guidedLearning")}</p>
          <h1>{t("studyPackView.studyPack")}</h1>
          <p>{t("studyPackView.keepRelated")}</p>
        </div>
        <div className="page-heading-mark" aria-hidden="true"><AppIcon name="studyPack" size={25} /></div>
      </div>
      <AccessStatusBanner />
      <div className="study-pack-grid">
        {STUDY_PACKS.map((pack) => {
          const packIdCamel = pack.id.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
          return (
            <article className={`study-pack-card${isPracticeUnlocked ? " study-pack-card-ready" : " study-pack-card-locked"}`} key={pack.id}>
            <div className="study-pack-icon" aria-hidden="true"><AppIcon name={pack.icon as IconName} size={23} /></div>
            <div className="study-pack-copy">
              <div className="card-title-row">
                <h2>{t(`studyPacks.${packIdCamel}Title` as TranslationKey)}</h2>
                {!isPracticeUnlocked ? <LockBadge locked label={t("common.lockedAction")} /> : null}
              </div>
              <p>{t(`studyPacks.${packIdCamel}Desc` as TranslationKey)}</p>
              <button
                className={`button${isPracticeUnlocked ? " button-accent" : " button-muted"}`}
                type="button"
                disabled={!isPracticeUnlocked}
                aria-label={isPracticeUnlocked ? `Open ${pack.title}` : `${pack.title} is locked`}
                onClick={() => {
                  if (!isPracticeUnlocked) return;
                  router.push(PRACTICE_ROUTES.practiceTests);
                }}
              >
                <AppIcon name={isPracticeUnlocked ? "play" : "lock"} size={15} />
                {isPracticeUnlocked ? t("studyPackView.openPack") : t("common.lockedAction")}
              </button>
            </div>
          </article>
        );
      })}
      </div>
    </div>
  );
}
