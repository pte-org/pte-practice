export function normalizePracticeText(value: string): string {
  return value.normalize("NFC");
}

/**
 * Words are counted the way the scorer does (split on whitespace), so a hyphenated word such as "well-known" is one
 * word here and there. A locale-aware segmenter would split it in two and let the screen show more words than count.
 */
export function countPracticeWords(value: string): number {
  const text = value.trim();
  if (!text) return 0;
  return text.split(/\s+/u).length;
}
