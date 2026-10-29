/** Fills `{token}` placeholders of an i18n template; unknown tokens are left as written. */
export function formatChatText(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, token: string) => (token in values ? String(values[token]) : match));
}
