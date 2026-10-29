const SAFE_SCHEME = /^(https?:|mailto:)/i;

/**
 * AI output is untrusted, so a link is rendered only for web and mail schemes. Everything else
 * (javascript:, data:, relative paths, protocol-relative URLs) stays plain text.
 */
export function isSafeChatHref(href: string | undefined | null): boolean {
  return typeof href === "string" && SAFE_SCHEME.test(href.trim());
}
