"use client";

import { useState, type ReactElement } from "react";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { AVATAR_GENDERS, type AvatarGender } from "@/features/practice/avatar/avatar";
import { StudentAvatar } from "@/features/practice/avatar/StudentAvatar";
import { useStudentAvatar } from "@/features/practice/avatar/StudentAvatarProvider";

const AVATAR_LABELS: Record<AvatarGender, TranslationKey> = {
  MALE: "settings.avatarMale",
  FEMALE: "settings.avatarFemale",
};

/** Picks the avatar the rail card shows. Saved the moment it is chosen. */
export const AvatarSettings = (): ReactElement => {
  const { t } = useTranslation();
  const { gender, choose } = useStudentAvatar();
  const [failed, setFailed] = useState(false);

  const pick = (next: AvatarGender): void => {
    setFailed(false);
    choose(next).catch(() => setFailed(true));
  };

  return (
    <section className="student-settings-avatar">
      <h3>{t("settings.avatar")}</h3>
      <div className="student-settings-avatar-options" role="radiogroup" aria-label={t("settings.avatar")}>
        {AVATAR_GENDERS.map((option) => (
          <label key={option}>
            <input type="radio" name="settings-avatar" checked={gender === option} onChange={() => pick(option)} />
            <StudentAvatar className="student-settings-avatar-image" gender={option} />
            <span>{t(AVATAR_LABELS[option])}</span>
          </label>
        ))}
      </div>
      {failed ? <p className="form-error" role="alert">{t("settings.avatarSaveError")}</p> : null}
    </section>
  );
};
