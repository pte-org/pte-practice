import type { PracticeCatalogSection } from "@/features/practice/contracts";
import { runnableTasks } from "@/features/practice/mode/mode-target";

/** Order of the skills on the Study-Pack page. */
export const STUDY_SKILL_ORDER = ["READING", "LISTENING", "SPEAKING", "WRITING"] as const;

export interface StudySkillRow {
  code: string;
  section: PracticeCatalogSection;
  answered: number;
  total: number;
  /** Whether "Practise" can start: practice is unlocked and the skill has a runnable task type with questions. */
  canStart: boolean;
}

/** One row per skill the catalog has, in Study-Pack order; skills the catalog lacks are left out. */
export function studySkillRows(sections: PracticeCatalogSection[], unlocked: boolean): StudySkillRow[] {
  return STUDY_SKILL_ORDER.flatMap((code) => {
    const section = sections.find((item) => item.code.toUpperCase() === code);
    if (!section) return [];
    return [{
      code,
      section,
      answered: Math.min(section.answeredQuestionCount, section.practiceQuestionCount),
      total: section.practiceQuestionCount,
      canStart: unlocked && section.practiceQuestionCount > 0 && runnableTasks(section).length > 0,
    }];
  });
}

export function totalPracticeQuestions(rows: StudySkillRow[]): number {
  return rows.reduce((sum, row) => sum + row.total, 0);
}
