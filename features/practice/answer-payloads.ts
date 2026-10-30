/** Pure builders for the answer payload shapes the practice API validates (strict field names). */
export type AnswerValue = Record<string, unknown>;

export const TYPE_IN_MAX_LENGTH = 128;

export function toggleChoice(value: AnswerValue, id: string, multiple: boolean): AnswerValue {
  if (!multiple) return { selectedOption: id };
  const selected = stringArray(value.selectedOptions);
  return { selectedOptions: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] };
}

export function selectedChoiceIds(value: AnswerValue): string[] {
  return Array.isArray(value.selectedOptions)
    ? stringArray(value.selectedOptions)
    : typeof value.selectedOption === "string" ? [value.selectedOption] : [];
}

export function wordIndexes(value: AnswerValue): number[] {
  return Array.isArray(value.selectedWordIndexes)
    ? value.selectedWordIndexes.filter((item): item is number => Number.isInteger(item) && item >= 0)
    : [];
}

export function toggleWordIndex(value: AnswerValue, index: number): AnswerValue {
  const selected = wordIndexes(value);
  const next = selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index];
  return { selectedWordIndexes: next.sort((left, right) => left - right) };
}

export function setBlankWord(value: AnswerValue, field: "placements" | "selections", gap: number,
  word: string): AnswerValue {
  const current = typeof value[field] === "object" && value[field] !== null
    ? { ...(value[field] as Record<string, unknown>) } : {};
  if (word) current[String(gap)] = word;
  else delete current[String(gap)];
  return { [field]: current };
}

export function typeInBlankValues(value: AnswerValue, count: number): string[] {
  const saved = Array.isArray(value.blanks) ? value.blanks : [];
  return Array.from({ length: Math.max(count, saved.length) },
    (_, index) => typeof saved[index] === "string" ? saved[index] : "");
}

/** Type-in blanks are positional, never comma separated, and at most 128 characters each. */
export function setTypeInBlank(value: AnswerValue, position: number, text: string, count: number): AnswerValue {
  const blanks = typeInBlankValues(value, count);
  blanks[position] = text.replaceAll(",", "").slice(0, TYPE_IN_MAX_LENGTH);
  return { blanks };
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
