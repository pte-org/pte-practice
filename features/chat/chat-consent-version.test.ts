import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { en, vi } from "@/common/i18n";
import { PRIVACY_CONTENT } from "@/features/privacy/privacy-content";
import { CHAT_CONSENT_POLICY_VERSION } from "./constants";

/**
 * Students agree to a specific text. If that text changes, `CHAT_CONSENT_POLICY_VERSION` (here and in the
 * backend's `ChatConstants.CONSENT_POLICY_VERSION`) must change with it, or students who already agreed to the
 * old words are never asked again. This test pins a fingerprint of the words that matter next to the version.
 *
 * When it fails after an intended wording change: set both versions to today's date, update PINNED below to the
 * values the failure message prints, and deploy web and backend together.
 */
const PINNED = {
  version: "2026-10-29",
  fingerprint: "1f1f244a1db08534",
};

const POLICY_HEADINGS = {
  en: ["The AI assistant", "Children and young people"],
  vi: ["Trợ lý AI", "Trẻ em và người chưa thành niên"],
} as const;

function agreedText() {
  const policySections = (locale: "en" | "vi") =>
    PRIVACY_CONTENT[locale].sections.filter((section) => (POLICY_HEADINGS[locale] as readonly string[]).includes(section.heading));
  return JSON.stringify({
    consent: { en: (en as unknown as { chat: { consent: unknown } }).chat.consent, vi: (vi as unknown as { chat: { consent: unknown } }).chat.consent },
    policy: { en: policySections("en"), vi: policySections("vi") },
  });
}

const fingerprint = () => createHash("sha256").update(agreedText()).digest("hex").slice(0, 16);

describe("consent policy version", () => {
  it("still finds the policy sections the fingerprint covers", () => {
    for (const locale of ["en", "vi"] as const) {
      const found = PRIVACY_CONTENT[locale].sections.filter((s) => (POLICY_HEADINGS[locale] as readonly string[]).includes(s.heading));
      expect(found).toHaveLength(POLICY_HEADINGS[locale].length);
    }
  });

  it("is bumped whenever the text students agree to changes", () => {
    const actual = { version: CHAT_CONSENT_POLICY_VERSION, fingerprint: fingerprint() };

    expect(actual, `Agreed text changed. If intended, bump both versions and pin: ${JSON.stringify(actual)}`).toEqual(PINNED);
  });

  it("matches the backend version when the backend repository sits next to this one", () => {
    const backend = join(
      fileURLToPath(new URL(".", import.meta.url)),
      "../../../pte-api/app/src/main/java/com/pte/chat/internal/constant/ChatConstants.java",
    );
    if (!existsSync(backend)) return;
    const match = readFileSync(backend, "utf8").match(/CONSENT_POLICY_VERSION\s*=\s*"([^"]+)"/);

    expect(match?.[1]).toBe(CHAT_CONSENT_POLICY_VERSION);
  });
});
