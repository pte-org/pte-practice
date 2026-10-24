import type { PracticeTaskContentOption } from "./contracts";

export interface SavedAnswerEntry {
  /** Position or gap the value belongs to; absent for a plain list of picks. */
  label?: string;
  value: string;
}

export type SavedAnswer =
  | { kind: "empty" }
  | { kind: "audio"; seconds: number | null }
  | { kind: "text"; text: string }
  | { kind: "entries"; entries: SavedAnswerEntry[] }
  | { kind: "raw"; text: string };

/** Turns the stored answer payload into something a student can read, instead of the raw JSON. */
export function describeSavedAnswer(payload: string | null, promptText: string | null,
  options: ReadonlyArray<Pick<PracticeTaskContentOption, "text" | "orderIndex">>): SavedAnswer {
  if (!payload) return { kind: "empty" };
  const value = parse(payload);
  if (!value) return { kind: "raw", text: payload };

  if (typeof value.text === "string") return { kind: "text", text: value.text };
  if (typeof value.mediaPublicId === "string") {
    return { kind: "audio", seconds: typeof value.durationSeconds === "number" ? value.durationSeconds : null };
  }

  const optionText = (id: string) => options.find((option) => String(option.orderIndex) === id)?.text ?? id;
  if (typeof value.selectedOption === "string") {
    return { kind: "entries", entries: [{ value: optionText(value.selectedOption) }] };
  }
  if (Array.isArray(value.selectedOptions)) {
    return { kind: "entries", entries: strings(value.selectedOptions).map((id) => ({ value: optionText(id) })) };
  }
  if (Array.isArray(value.order)) {
    return {
      kind: "entries",
      entries: strings(value.order).map((id, index) => ({ label: String(index + 1), value: optionText(id) })),
    };
  }
  if (Array.isArray(value.blanks)) {
    return {
      kind: "entries",
      entries: value.blanks.map((blank, index) => ({ label: String(index + 1), value: typeof blank === "string" ? blank : "" })),
    };
  }
  for (const field of ["placements", "selections"] as const) {
    const byGap = value[field];
    if (typeof byGap === "object" && byGap !== null) {
      return {
        kind: "entries",
        entries: Object.entries(byGap).map(([gap, word]) => ({ label: gap, value: typeof word === "string" ? word : "" })),
      };
    }
  }
  if (Array.isArray(value.selectedWordIndexes)) {
    const words = (promptText ?? "").split(/\s+/).filter(Boolean);
    return {
      kind: "entries",
      entries: value.selectedWordIndexes
        .filter((index): index is number => Number.isInteger(index))
        .map((index) => ({ value: words[index] ?? String(index) })),
    };
  }
  return { kind: "raw", text: payload };
}

function parse(payload: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(payload);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function strings(values: unknown[]): string[] {
  return values.filter((item): item is string => typeof item === "string");
}
