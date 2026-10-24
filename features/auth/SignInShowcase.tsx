"use client";

import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { SHOWCASE_CONTENT } from "./constants";

/** Decorative laptop + phone preview of a practice session, drawn with markup so it follows the theme. */
export function SignInShowcase() {
  const { t } = useTranslation();
  return (
    <div className="sign-in-showcase" role="img" aria-label={t("auth.showcaseLabel")}>
      <div className="showcase-laptop" aria-hidden="true">
        <div className="showcase-laptop-screen">
          <div className="showcase-progress"><span className="showcase-progress-laptop" /></div>
          <div className="showcase-columns">
            <div>
              <strong>{SHOWCASE_CONTENT.laptopTask}</strong>
              <p>{SHOWCASE_CONTENT.laptopQuestion}</p>
              <p className="showcase-muted">{SHOWCASE_CONTENT.laptopPassage}</p>
            </div>
            <div>
              {SHOWCASE_CONTENT.laptopOptions.map((option) => (
                <div key={option.text} className={`showcase-option${option.correct ? " showcase-option-correct" : ""}`}>
                  {option.correct ? <AppIcon name="check" size={11} /> : null}
                  {option.text}
                </div>
              ))}
              <div className="showcase-score">
                <span>{t("auth.showcaseScore")}</span>
                <span>{t("auth.showcaseTime")}</span>
                <span>{t("auth.showcaseConfidence")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="showcase-laptop-base" />
      </div>
      <div className="showcase-phone" aria-hidden="true">
        <div className="showcase-phone-screen">
          <div className="showcase-progress"><span className="showcase-progress-phone" /></div>
          <strong>{SHOWCASE_CONTENT.phoneTask}</strong>
          <span className="showcase-muted">{t("auth.showcaseTiming")}</span>
          <p>{SHOWCASE_CONTENT.phonePassage}</p>
          <div className="showcase-wave" />
          <div className="showcase-mic"><AppIcon name="mic" size={16} /></div>
        </div>
      </div>
    </div>
  );
}
