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
