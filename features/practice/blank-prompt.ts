export type BlankSegment =
  | { kind: "text"; text: string }
  | { kind: "gap"; index: number };

const GAP_MARKER = /\{\{(\d+)\}\}/g;

/** Splits a fill-in-the-blanks passage on {{n}} gap markers (same format as the exam app). */
export function parseBlankPrompt(prompt: string): BlankSegment[] {
  const segments: BlankSegment[] = [];
  let cursor = 0;
  for (const match of prompt.matchAll(GAP_MARKER)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ kind: "text", text: prompt.slice(cursor, start) });
    segments.push({ kind: "gap", index: Number.parseInt(match[1], 10) });
    cursor = start + match[0].length;
  }
  if (cursor < prompt.length) segments.push({ kind: "text", text: prompt.slice(cursor) });
  return segments.length > 0 ? segments : [{ kind: "text", text: prompt }];
}
