import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const practice = readFileSync(new URL("../../../../common/components/button.css", import.meta.url), "utf8");
const web = readFileSync(new URL("../../../../../pte-web/packages/ui/src/styles/design-tokens.css", import.meta.url), "utf8");

function tokens(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/--(action(?:-[a-z]+)*):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

describe("pte-web shared action palette", () => {
  it("keeps light and dark action colors exactly aligned with the web common tokens", () => {
    const webLight = tokens(web.split('[data-theme="dark"]')[0]);
    const webDark = tokens(web.split('[data-theme="dark"]')[1]);
    const practiceDark = tokens(practice.split('html[data-theme="light"]')[0]);
    const practiceLight = tokens(practice.split('html[data-theme="light"]')[1].split("}")[0]);
    for (const name of ["action", "action-hover", "action-active", "action-gradient-start", "action-gradient-mid", "action-gradient-end", "action-tint", "action-tint-hover", "action-foreground"]) {
      expect(practiceLight[name], `light ${name}`).toBe(webLight[name]);
      expect(practiceDark[name], `dark ${name}`).toBe(webDark[name]);
    }
  });
});
