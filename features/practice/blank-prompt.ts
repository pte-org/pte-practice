export type BlankSegment =
  | { kind: "text"; text: string }
  | { kind: "gap"; index: number };

/**
 * A gap is {{n}} (same format as the exam app). A passage that was stored with the blank written another way
 * (__BLANK__, [BLANK], a bare {{}}, a run of underscores) still gets its gaps, numbered in reading order, so the
 * learner can answer it instead of seeing the raw marker.
 */
const GAP_MARKER = /\{\{(\d+)\}\}|__BLANK__|\[\s*BLANK\s*\]|\{\{\s*\}\}|_{3,}/gi;

/** Splits a fill-in-the-blanks passage on its gap markers. */
export function parseBlankPrompt(prompt: string): BlankSegment[] {
  const segments: BlankSegment[] = [];
  let cursor = 0;
  let gapCount = 0;
  for (const match of prompt.matchAll(GAP_MARKER)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ kind: "text", text: prompt.slice(cursor, start) });
    const numbered = match[1] === undefined ? null : Number.parseInt(match[1], 10);
    segments.push({ kind: "gap", index: numbered ?? gapCount });
    gapCount += 1;
    cursor = start + match[0].length;
  }
  if (cursor < prompt.length) segments.push({ kind: "text", text: prompt.slice(cursor) });
  return segments.length > 0 ? segments : [{ kind: "text", text: prompt }];
}
