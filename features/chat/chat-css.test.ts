import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CHAT_DIR = fileURLToPath(new URL(".", import.meta.url));
const CSS_PATH = join(CHAT_DIR, "chat.css");

const readCss = () => readFileSync(CSS_PATH, "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/** Returns the body of the first rule whose selector list contains `selector` as a standalone selector. */
function ruleBodies(css: string, selector: string): string[] {
  const bodies: string[] = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of stripComments(css).matchAll(pattern)) {
    const selectors = match[1].split(",").map((s) => s.trim());
    if (selectors.some((s) => s === selector || s.endsWith(` ${selector}`) || s.endsWith(`>${selector}`))) {
      bodies.push(match[2]);
    }
  }
  return bodies;
}

describe("chat.css", () => {
  it("exists next to the chat feature", () => {
    expect(existsSync(CSS_PATH)).toBe(true);
  });

  it("loads the typography plugin", () => {
    expect(stripComments(readCss())).toContain('@plugin "@tailwindcss/typography"');
  });

  it("imports only the Tailwind utilities, without scanning sources", () => {
    const css = stripComments(readCss());
    expect(css).toMatch(/@import\s+["']tailwindcss\/utilities(\.css)?["'][^;]*source\(none\)/);
  });

  it("never imports the whole tailwindcss package or its preflight", () => {
    const css = stripComments(readCss());
    expect(css).not.toMatch(/@import\s+["']tailwindcss["']/);
    expect(css).not.toMatch(/@import\s+["']tailwindcss\/preflight/);
    expect(css).not.toMatch(/@import\s+["']tailwindcss\/index/);
    expect(css).not.toMatch(/@tailwind\s+base/);
  });

  it("scrolls wide tables horizontally", () => {
    const bodies = ruleBodies(readCss(), ".chat-md-scroll");
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.join(" ")).toMatch(/overflow-x\s*:\s*auto/);
  });

  it("scrolls wide code blocks horizontally", () => {
    const bodies = ruleBodies(readCss(), ".chat-md-pre");
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.join(" ")).toMatch(/overflow-x\s*:\s*auto/);
  });

  it("breaks long unbroken words", () => {
    const bodies = ruleBodies(readCss(), ".chat-markdown");
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.join(" ")).toMatch(/overflow-wrap\s*:\s*(anywhere|break-word)/);
  });

  it("fades new bubbles in but not for people who ask for less motion", () => {
    const css = stripComments(readCss());
    expect(ruleBodies(css, ".chat-bubble").join(" ")).toMatch(/animation\s*:\s*chat-fade-in/);
    const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}\s*\}/g) ?? [];
    expect(reduced.join(" ")).toMatch(/\.chat-bubble\s*\{[^}]*animation\s*:\s*none/);
  });

  it("floats a small box over the exercise instead of pushing the exercise aside", () => {
    const css = stripComments(readCss());
    expect(css).not.toMatch(/grid-template-columns/);
    const panel = ruleBodies(css, ".chat-panel").join(" ");
    expect(panel).toMatch(/position\s*:\s*fixed/);
    expect(panel).toMatch(/width\s*:\s*min\(\s*\d+px/);
    expect(panel).toMatch(/height\s*:\s*min\(\s*\d+px/);
  });

  it("keeps the floating box clear of the exercise's sticky footer", () => {
    const panel = ruleBodies(stripComments(readCss()), ".chat-panel").join(" ");
    expect(panel).toMatch(/bottom\s*:\s*var\(--chat-toggle-bottom\)/);
  });

  it("never covers the whole screen, even on a narrow one", () => {
    const css = stripComments(readCss());
    expect(css).not.toMatch(/inset\s*:\s*0/);
    const narrow = css.match(/@media\s*\(max-width:\s*960px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(narrow).toMatch(/\.chat-panel\s*\{[^}]*width\s*:\s*calc\(100vw/);
    expect(narrow).toMatch(/\.chat-panel\s*\{[^}]*height\s*:\s*min\(\s*\d+px/);
    expect(narrow).not.toMatch(/border-radius\s*:\s*0/);
  });

  it("never moves the exercise sideways, open or closed: the window pops up over it", () => {
    const css = stripComments(readCss());
    expect(ruleBodies(css, ".chat-layout-main").join(" ")).not.toMatch(/margin-right|padding-right/);
    expect(css).not.toMatch(/margin-right\s*:\s*calc\(\s*380px/);
  });

  it("scrolls the exercise clear above the window on a narrow screen", () => {
    const css = stripComments(readCss());
    const narrow = (css.match(/@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*?\n\}/g) ?? []).join("\n");
    expect(narrow).toMatch(/data-open="true"\]\s*\.chat-layout-main\s*\{[^}]*padding-bottom/);
  });

  it("opens from a round bubble button at the bottom right, not a tab on the edge", () => {
    const toggle = ruleBodies(stripComments(readCss()), ".chat-toggle").join(" ");
    expect(toggle).toMatch(/position\s*:\s*fixed/);
    expect(toggle).toMatch(/right\s*:\s*24px/);
    expect(toggle).toMatch(/border-radius\s*:\s*999px/);
    expect(toggle).not.toMatch(/writing-mode/);
  });

  it("pops the window in with a short animation", () => {
    const css = stripComments(readCss());
    expect(ruleBodies(css, ".chat-panel").join(" ")).toMatch(/animation\s*:\s*chat-pop/);
    expect(css).toMatch(/@keyframes\s+chat-pop/);
  });

  it("names the floating button offset instead of repeating a bare number", () => {
    const css = stripComments(readCss());
    expect(css).toMatch(/--chat-toggle-bottom\s*:\s*96px/);
    expect(css).toMatch(/bottom\s*:\s*var\(--chat-toggle-bottom\)/);
    expect(css).not.toMatch(/(?<![-\w])bottom\s*:\s*96px/);
  });

  it("styles the suggestion chips, copy button and quota badge", () => {
    const css = readCss();
    for (const selector of [".chat-suggestion", ".chat-copy", ".chat-toggle-badge"]) {
      expect(ruleBodies(css, selector).length, selector).toBeGreaterThan(0);
    }
  });

  it("scopes every handwritten rule under a chat- class (no global element selectors)", () => {
    const css = stripComments(readCss());
    // Drop at-rules without a block (@import, @plugin, @source, @layer x;) before looking at rule selectors.
    const withoutStatements = css.replace(/@[a-z-]+[^;{}]*;/gi, "");
    const offenders: string[] = [];
    for (const match of withoutStatements.matchAll(/([^{}]+)\{/g)) {
      const prelude = match[1].trim();
      if (prelude.startsWith("@")) continue; // @media / @supports / @layer blocks
      for (const selector of prelude.split(",").map((s) => s.trim()).filter(Boolean)) {
        if (/^(from|to|\d+%)$/.test(selector)) continue; // keyframe steps
        if (selector.startsWith("&")) continue; // nested rule, already inside a scoped parent
        if (!/^\.chat-/.test(selector)) offenders.push(selector);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("chat feature source safety", () => {
  const sources = listFiles(CHAT_DIR).filter(
    (file) => !/\.test\.[tj]sx?$/.test(file) && /\.(ts|tsx|js|jsx|css)$/.test(file),
  );

  it("has production TypeScript sources to scan", () => {
    expect(sources.filter((file) => /\.tsx?$/.test(file)).length).toBeGreaterThan(0);
  });

  it("never uses dangerouslySetInnerHTML", () => {
    const offenders = sources.filter((file) => readFileSync(file, "utf8").includes("dangerouslySetInnerHTML"));
    expect(offenders).toEqual([]);
  });

  it("never uses rehype-raw", () => {
    const offenders = sources.filter((file) => readFileSync(file, "utf8").includes("rehype-raw"));
    expect(offenders).toEqual([]);
  });
});
