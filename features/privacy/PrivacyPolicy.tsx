"use client";

import "./privacy.css";
import { useTranslation } from "@/common/i18n";
import { PRIVACY_CONTENT, PRIVACY_UPDATED } from "./privacy-content";

/** Public page: no sign-in is needed to read it, so a student can open it from the consent screen. */
export function PrivacyPolicy() {
  const { locale } = useTranslation();
  const content = PRIVACY_CONTENT[locale];
  return (
    <main className="privacy-page">
      <h1 className="privacy-title">{content.title}</h1>
      <p className="privacy-updated">{content.updatedLabel}: {PRIVACY_UPDATED}</p>
      {content.sections.map((section) => (
        <section key={section.heading} className="privacy-section">
          <h2 className="privacy-heading">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
    </main>
  );
}
