import { describe, expect, it } from "vitest";
import { isSafeChatHref } from "@/features/chat/chat-links";

describe("isSafeChatHref", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1#frag",
    "mailto:teacher@example.com",
    "HTTPS://EXAMPLE.COM",
    "HtTp://example.com",
    "MAILTO:a@b.co",
    "  https://example.com  ",
    "\nhttps://example.com\n",
  ])("allows %j", (href) => {
    expect(isSafeChatHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "JAVASCRIPT:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java\rscript:alert(1)",
    "\u0001javascript:alert(1)",
    "\u0000javascript:alert(1)",
    "\u001fjavascript:alert(1)",
    "&#106;avascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "DATA:text/html;base64,AAAA",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com/file",
    "blob:https://example.com/id",
    "tel:+123456789",
    "//evil.example.com",
    "///evil.example.com",
    "/relative/path",
    "relative/path",
    "./relative",
    "../up",
    "#anchor",
    "?query=1",
    "example.com",
    "",
    "   ",
  ])("rejects %j", (href) => {
    expect(isSafeChatHref(href)).toBe(false);
  });

  it.each([undefined, null, 42, {}, [], true])("rejects the non-string %j", (href) => {
    expect(isSafeChatHref(href as never)).toBe(false);
  });
});
