"use client";

import { useState } from "react";
import { AppIcon, type IconName } from "@/features/icons/AppIcon";
import { AccessStatusBanner } from "@/features/practice/AccessStatusBanner";
import { LockBadge } from "@/features/common/LockBadge";
import { STUDY_PACKS, UI_TEXT } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";

export function StudyPackView() {
  const { isPracticeUnlocked, refreshEntitlement } = usePractice();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="page-stack" data-testid="study-pack-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Guided learning</p>
          <h1>Study-Pack</h1>
          <p>Keep related practice activities together and return to them when you are ready.</p>
        </div>
        <div className="page-heading-mark" aria-hidden="true"><AppIcon name="studyPack" size={25} /></div>
      </div>
      <AccessStatusBanner />
      {notice ? <p className="inline-notice" role="status">{notice}</p> : null}
      <div className="study-pack-grid">
        {STUDY_PACKS.map((pack) => (
          <article className={`study-pack-card${isPracticeUnlocked ? " study-pack-card-ready" : " study-pack-card-locked"}`} key={pack.id}>
            <div className="study-pack-icon" aria-hidden="true"><AppIcon name={pack.icon as IconName} size={23} /></div>
            <div className="study-pack-copy">
              <div className="card-title-row">
                <h2>{pack.title}</h2>
                <LockBadge locked={!isPracticeUnlocked} label={isPracticeUnlocked ? "Available" : UI_TEXT.lockedAction} />
              </div>
              <p>{pack.description}</p>
              <button
                className={`button${isPracticeUnlocked ? " button-accent" : " button-muted"}`}
                type="button"
                disabled={!isPracticeUnlocked}
                aria-label={isPracticeUnlocked ? `Open ${pack.title}` : `${pack.title} is locked`}
                onClick={() => {
                  if (!isPracticeUnlocked) return;
                  setNotice(`${pack.title} is ready. ${UI_TEXT.sessionPlaceholder}`);
                  void refreshEntitlement();
                }}
              >
                <AppIcon name={isPracticeUnlocked ? "play" : "lock"} size={15} />
                {isPracticeUnlocked ? "Open pack" : UI_TEXT.lockedAction}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
