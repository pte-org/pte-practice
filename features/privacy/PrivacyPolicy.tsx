"use client";

import Link from "next/link";
import "./privacy.css";
import { AppIcon, ProductMark } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { useTheme } from "@/common/providers/ThemeProvider";
import { BRAND_NAME } from "@/features/auth/constants";
import { PRACTICE_ROUTES } from "@/features/practice/constants";
import {
  PRIVACY_CONTACT_EMAIL, PRIVACY_CONTENT, PRIVACY_OPERATOR, PRIVACY_UPDATED, privacySectionId,
} from "./privacy-content";

/** Public page: no sign-in is needed to read it, so a student can open it from the consent screen. */
export function PrivacyPolicy() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const content = PRIVACY_CONTENT[locale];
  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <Link href={PRACTICE_ROUTES.signIn} className="privacy-brand" aria-label={content.backLabel}>
          <span className="brand-mark brand-mark-small" aria-hidden="true"><ProductMark /></span>
          <span className="privacy-brand-name">{BRAND_NAME.prefix}<b>{BRAND_NAME.suffix}</b></span>
        </Link>
        <div className="privacy-actions">
          <Link href={PRACTICE_ROUTES.signIn} className="privacy-back">
            <AppIcon name="chevronLeft" size={16} />
            {content.backLabel}
          </Link>
          <button className="icon-button" type="button" onClick={() => setLocale(locale === "en" ? "vi" : "en")}
            aria-label={t("auth.toggleLanguage")} title={t("auth.toggleLanguage")}>{locale.toUpperCase()}</button>
          <button className="icon-button" type="button" onClick={toggleTheme}
            aria-label={t("auth.toggleTheme")} title={t("auth.toggleTheme")}>
            <AppIcon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
        </div>
      </header>

      <div className="privacy-hero">
        <span className="privacy-hero-icon" aria-hidden="true"><AppIcon name="lock" size={22} /></span>
        <h1 className="privacy-title">{content.title}</h1>
        <p className="privacy-updated">{content.updatedLabel}: {PRIVACY_UPDATED}</p>
      </div>

      <div className="privacy-layout">
        <nav className="privacy-toc" aria-label={content.tocLabel}>
          <p className="privacy-toc-title">{content.tocLabel}</p>
          <ol className="privacy-toc-list">
            {content.sections.map((section, index) => (
              <li key={section.heading}>
                <a href={`#${privacySectionId(index)}`} className="privacy-toc-link">{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="privacy-content">
          {content.sections.map((section, index) => (
            <section key={section.heading} id={privacySectionId(index)} className="privacy-card"
              aria-labelledby={`${privacySectionId(index)}-title`}>
              <h2 id={`${privacySectionId(index)}-title`} className="privacy-heading">
                <span className="privacy-number" aria-hidden="true">{index + 1}</span>
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </main>
      </div>

      <footer className="privacy-footer">
        <p>{content.contactLabel}</p>
        <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="privacy-contact">{PRIVACY_CONTACT_EMAIL}</a>
        <p className="privacy-copy">© {PRIVACY_OPERATOR}</p>
      </footer>
    </div>
  );
}
