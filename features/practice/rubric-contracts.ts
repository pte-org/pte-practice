export interface PracticeRubricLevel { level: number; text: string }

export interface PracticeRubricTrait {
  key: string;
  displayNameVi: string;
  displayNameEn: string;
  /** Null for a per-word trait, whose maximum is the prompt's word count. */
  maxScore: number | null;
  levels: PracticeRubricLevel[];
}

export interface PracticeRubric { taskType: string; traits: PracticeRubricTrait[] }

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

export function normalizeRubric(value: unknown): PracticeRubric {
  const record = asRecord(value);
  const traits = Array.isArray(record.traits) ? record.traits.flatMap((raw): PracticeRubricTrait[] => {
    const trait = asRecord(raw);
    if (typeof trait.key !== "string") return [];
    const levels = Array.isArray(trait.levels) ? trait.levels.flatMap((rawLevel): PracticeRubricLevel[] => {
      const level = asRecord(rawLevel);
      return typeof level.level === "number" && typeof level.text === "string" ? [{ level: level.level, text: level.text }] : [];
    }) : [];
    return [{
      key: trait.key,
      displayNameVi: typeof trait.displayNameVi === "string" ? trait.displayNameVi : trait.key,
      displayNameEn: typeof trait.displayNameEn === "string" ? trait.displayNameEn : trait.key,
      maxScore: typeof trait.maxScore === "number" ? trait.maxScore : null,
      levels,
    }];
  }) : [];
  return { taskType: typeof record.taskType === "string" ? record.taskType : "", traits };
}
