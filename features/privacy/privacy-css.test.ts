import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(join(fileURLToPath(new URL(".", import.meta.url)), "privacy.css"), "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function ruleBodies(css: string, selector: string): string[] {
  const bodies: string[] = [];
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].split(",").map((s) => s.trim()).includes(selector)) bodies.push(match[2]);
  }
  return bodies;
}

describe("privacy.css", () => {
  it("has a sticky header so the brand and the language and theme buttons stay in reach", () => {
    const header = ruleBodies(CSS, ".privacy-header").join(" ");
    expect(header).toMatch(/position\s*:\s*sticky/);
    expect(header).toMatch(/top\s*:\s*0/);
  });

  it("lays out a contents column beside the text on a wide screen and stacks them on a narrow one", () => {
    const css = stripComments(CSS);
    expect(ruleBodies(css, ".privacy-layout").join(" ")).toMatch(/grid-template-columns/);
    expect(css).toMatch(/@media\s*\(min-width:\s*\d+px\)/);
    expect(ruleBodies(css, ".privacy-toc").join(" ")).toMatch(/position\s*:\s*sticky/);
  });

  it("keeps the text column readable", () => {
    expect(ruleBodies(CSS, ".privacy-content").join(" ")).toMatch(/max-width\s*:\s*\d+(px|ch)/);
  });

  it("gives each section a card and leaves room under the sticky header when jumping to it", () => {
    expect(ruleBodies(CSS, ".privacy-card").join(" ")).toMatch(/border/);
    expect(ruleBodies(CSS, ".privacy-card").join(" ")).toMatch(/scroll-margin-top/);
  });

  it("scopes every rule under a privacy- class (no global element selectors)", () => {
    const css = stripComments(CSS).replace(/@[a-z-]+[^;{}]*;/gi, "");
    const offenders: string[] = [];
    for (const match of css.matchAll(/([^{}]+)\{/g)) {
      const prelude = match[1].trim();
      if (prelude.startsWith("@")) continue;
      for (const selector of prelude.split(",").map((s) => s.trim()).filter(Boolean)) {
        if (!/^\.privacy-/.test(selector)) offenders.push(selector);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("hides the buttons and the contents when printed", () => {
    expect(stripComments(CSS)).toMatch(/@media\s+print\s*\{[\s\S]*\.privacy-toc[\s\S]*display\s*:\s*none/);
  });
});
