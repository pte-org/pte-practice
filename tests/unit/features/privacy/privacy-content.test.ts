import { describe, expect, it } from "vitest";
import {
  PRIVACY_CONTACT_EMAIL, PRIVACY_CONTENT, PRIVACY_OPERATOR, PRIVACY_PATH, PRIVACY_UPDATED, privacySectionId,
} from "@/features/privacy/privacy-content";

const LOCALES = ["en", "vi"] as const;

describe("privacy policy content", () => {
  it("lives at /privacy and names the operator and the contact", () => {
    expect(PRIVACY_PATH).toBe("/privacy");
    expect(PRIVACY_OPERATOR).toBe("PTE Prep");
    expect(PRIVACY_CONTACT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(PRIVACY_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(LOCALES)("has a title and non-empty sections in %s", (locale) => {
    const content = PRIVACY_CONTENT[locale];
    expect(content.title.trim()).not.toBe("");
    expect(content.sections.length).toBeGreaterThanOrEqual(8);
    for (const section of content.sections) {
      expect(section.heading.trim()).not.toBe("");
      expect(section.paragraphs.length).toBeGreaterThan(0);
      for (const paragraph of section.paragraphs) expect(paragraph.trim()).not.toBe("");
    }
  });

  it("has the same number of sections in both languages", () => {
    expect(PRIVACY_CONTENT.vi.sections.length).toBe(PRIVACY_CONTENT.en.sections.length);
  });

  it.each(LOCALES)("shows the operator and the contact email in %s", (locale) => {
    const text = JSON.stringify(PRIVACY_CONTENT[locale]);
    expect(text).toContain(PRIVACY_OPERATOR);
    expect(text).toContain(PRIVACY_CONTACT_EMAIL);
  });

  it.each(LOCALES)("covers the chat promises in %s: Google, no training, masking, cache, 16 years, retention", (locale) => {
    const text = JSON.stringify(PRIVACY_CONTENT[locale]);
    expect(text).toContain("Google");
    expect(text).toMatch(/12/);
    expect(text).toMatch(/16/);
    expect(text).toMatch(locale === "en" ? /train/i : /huấn luyện/);
    expect(text).toMatch(locale === "en" ? /\[email\]/ : /\[email\]/);
    expect(text).toMatch(locale === "en" ? /shared|identical/i : /dùng chung|giống hệt/);
  });

  it.each(LOCALES)("has the page labels (back link, contents, contact) in %s", (locale) => {
    const content = PRIVACY_CONTENT[locale];
    for (const label of [content.backLabel, content.tocLabel, content.contactLabel]) expect(label.trim()).not.toBe("");
  });

  it("builds a stable anchor per section, starting at 1", () => {
    expect(privacySectionId(0)).toBe("privacy-section-1");
    expect(privacySectionId(9)).toBe("privacy-section-10");
  });

  it("has no unfilled placeholders", () => {
    const text = JSON.stringify(PRIVACY_CONTENT);
    expect(text).not.toMatch(/\[(đầu mối|contact point|TODO|TBD)[^\]]*\]/i);
    expect(text).not.toMatch(/TODO|TBD|lorem/i);
  });
});
