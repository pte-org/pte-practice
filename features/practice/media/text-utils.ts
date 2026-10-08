export function normalizePracticeText(value: string): string {
  return value.normalize("NFC");
}

export function countPracticeWords(value: string): number {
  const text = value.trim();
  if (!text) return 0;
  const Segmenter = Intl.Segmenter;
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: "word" });
    return [...segmenter.segment(text)].filter((segment) => segment.isWordLike).length;
  }
  return text.split(/\s+/u).length;
}
