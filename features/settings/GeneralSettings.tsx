"use client";

import type { ReactElement } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { useTheme } from "@/common/providers/ThemeProvider";

export const GeneralSettings = (): ReactElement => {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  return (
    <div className="student-settings-general">
      <fieldset>
        <legend>{t("settings.language")}</legend>
        <div className="student-settings-options" role="radiogroup" aria-label={t("settings.language")}>
          {(["vi", "en"] as const).map((language) => <label key={language}>
            <input type="radio" name="settings-language" checked={locale === language} onChange={() => setLocale(language)} />
            <span>{t(language === "vi" ? "settings.vietnamese" : "settings.english")}</span>
          </label>)}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("settings.theme")}</legend>
        <div className="student-settings-options" role="radiogroup" aria-label={t("settings.theme")}>
          {(["light", "dark"] as const).map((choice) => <label key={choice}>
            <input type="radio" name="settings-theme" checked={theme === choice} onChange={() => setTheme(choice)} />
            <AppIcon name={choice === "light" ? "sun" : "moon"} size={18} />
            <span>{t(choice === "light" ? "settings.light" : "settings.dark")}</span>
          </label>)}
        </div>
      </fieldset>
    </div>
  );
};
