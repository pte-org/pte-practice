import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMarkdown } from "@/features/chat/ChatMarkdown";

const render = (markdown: string) => renderToStaticMarkup(<ChatMarkdown markdown={markdown} />);

const TABLE = ["| Tense | Example |", "| --- | --- |", "| Past | I walked |", "| Present | I walk |"].join("\n");

describe("ChatMarkdown structure", () => {
  it("renders inside a root element with the chat-markdown class", () => {
    expect(render("hello")).toMatch(/^<div[^>]*class="[^"]*\bchat-markdown\b[^"]*"/);
  });

  it("renders paragraphs, bold and emphasis as proper tags", () => {
    const html = render("Use **bold** and *italic* text.");
    expect(html).toContain("<p>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders headings", () => {
    const html = render("## Grammar tips");
    expect(html).toContain("<h2>Grammar tips</h2>");
  });

  it("renders bullet and numbered lists", () => {
    const html = render("- first\n- second\n\n1. one\n2. two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<li>two</li>");
  });

  it("renders inline code", () => {
    expect(render("Try `have been`.")).toContain("<code>have been</code>");
  });

  it("does not truncate long unbroken text", () => {
    const long = "a".repeat(5000);
    expect(render(long)).toContain(long);
  });
});

describe("ChatMarkdown scrolling wrappers", () => {
  it("wraps a GFM table in a chat-md-scroll element", () => {
    const html = render(TABLE);
    expect(html).toMatch(/<[a-z]+[^>]*class="[^"]*\bchat-md-scroll\b[^"]*"[^>]*>\s*<table/);
    expect(html).toContain("<th>Tense</th>");
    expect(html).toContain("<td>I walked</td>");
  });

  it("does not wrap ordinary content in the table wrapper", () => {
    expect(render("just text")).not.toContain("chat-md-scroll");
  });

  it("marks fenced code blocks with chat-md-pre", () => {
    const html = render("```js\nconst a = 1;\n```");
    expect(html).toContain("chat-md-pre");
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain("const a = 1;");
  });
});

describe("ChatMarkdown raw HTML and images", () => {
  it("never renders a script element", () => {
    const html = render("before <script>alert(1)</script> after");
    expect(html).not.toMatch(/<script/i);
  });

  it("never renders an img element from raw HTML", () => {
    const html = render("<img src=x onerror=alert(1)>");
    expect(html).not.toMatch(/<img/i);
  });

  it("never renders other raw HTML elements", () => {
    const html = render("<div onclick=\"alert(1)\">x</div><iframe src=\"https://e.com\"></iframe><b>raw</b>");
    expect(html).not.toMatch(/<iframe/i);
    expect(html).not.toContain("<b>");
    expect(html).not.toMatch(/<[^>]*onclick/i);
  });

  it("blocks markdown image syntax", () => {
    const html = render("![x](https://e.com/a.png)");
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toContain("a.png");
  });
});

describe("ChatMarkdown links", () => {
  it("opens http(s) links in a new tab without opener or referrer", () => {
    const html = render("[ok](https://example.com)");
    expect(html).toMatch(/<a /);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    const rel = html.match(/rel="([^"]*)"/)?.[1] ?? "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("applies the same treatment to bare URLs autolinked by GFM", () => {
    const html = render("see https://example.com/page now");
    expect(html).toContain('href="https://example.com/page"');
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*noopener[^"]*"/);
  });

  it("allows mailto links", () => {
    const html = render("[m](mailto:a@b.co)");
    expect(html).toContain('href="mailto:a@b.co"');
  });

  it("does not produce an anchor for a javascript: link", () => {
    const html = render("[bad](javascript:alert(1))");
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/javascript:alert/i);
    expect(html).toContain("bad");
  });

  it("does not produce an anchor for a data: link", () => {
    const html = render("[bad](data:text/html,x)");
    expect(html).not.toMatch(/href="data:/i);
    expect(html).toContain("bad");
  });

  it("does not produce an anchor for a mixed-case javascript: link", () => {
    const html = render("[bad](JaVaScRiPt:alert(1))");
    expect(html).not.toMatch(/href="javascript:/i);
  });
});
