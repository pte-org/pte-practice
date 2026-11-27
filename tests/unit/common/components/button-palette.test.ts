import { existsSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const WEB_TOKENS_PATH = new URL("../../../../../pte-web/packages/ui/src/styles/design-tokens.css", import.meta.url);

function tokens(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/--(action(?:-[a-z]+)*):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

describe.skipIf(!existsSync(WEB_TOKENS_PATH))("pte-web shared action palette", () => {
  let practice: string;
  let web: string;

  beforeAll(() => {
    // Single-repo checkouts lack pte-web; skipped suites are still collected.
    practice = readFileSync(new URL("../../../../common/components/button.css", import.meta.url), "utf8");
    web = readFileSync(WEB_TOKENS_PATH, "utf8");
  });

  it("keeps light and dark action colors exactly aligned with the web common tokens", () => {
    // The dark palette starts at its own rule; the same selector also appears earlier, in the `dark:` variant comment.
    const darkRule = web.indexOf("\n[data-theme=\"dark\"] {");
    expect(darkRule, "dark palette rule in the web tokens").toBeGreaterThan(-1);
    const webLight = tokens(web.slice(0, darkRule));
    const webDark = tokens(web.slice(darkRule));
    const practiceDark = tokens(practice.split('html[data-theme="light"]')[0]);
    const practiceLight = tokens(practice.split('html[data-theme="light"]')[1].split("}")[0]);
    for (const name of ["action", "action-hover", "action-active", "action-gradient-start", "action-gradient-mid", "action-gradient-end", "action-tint", "action-tint-hover", "action-foreground"]) {
      expect(practiceLight[name], `light ${name}`).toBe(webLight[name]);
      expect(practiceDark[name], `dark ${name}`).toBe(webDark[name]);
    }
  });
});
