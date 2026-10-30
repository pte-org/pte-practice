import { PRACTICE_SECTION_ORDER, PRACTICE_TASK_ORDER, TARGET_PRACTICE_SECTIONS } from "./constants";
import type { PracticeCatalogSection, PracticeCatalogTask } from "./contracts";

export function orderCatalogSections(sections: PracticeCatalogSection[]): PracticeCatalogSection[] {
  const allTasks = sections.flatMap((s) => s.taskTypes);
  const hasStandardTasks = allTasks.some((t) => PRACTICE_TASK_ORDER.includes(t.code as never));

  if (!hasStandardTasks) {
    return [...sections]
      .sort((left, right) => rank(PRACTICE_SECTION_ORDER, left.code) - rank(PRACTICE_SECTION_ORDER, right.code))
      .map((section) => ({
        ...section,
        taskTypes: [...section.taskTypes].sort(
          (left, right) => rank(PRACTICE_TASK_ORDER, left.code) - rank(PRACTICE_TASK_ORDER, right.code),
        ),
      }));
  }

  const taskMap = new Map<string, PracticeCatalogTask>();
  for (const task of allTasks) {
    taskMap.set(task.code, task);
  }

  const existingSections = new Map<string, PracticeCatalogSection>();
  for (const s of sections) {
    existingSections.set(s.code.toUpperCase(), s);
  }

  return TARGET_PRACTICE_SECTIONS.map((target) => {
    const existing = existingSections.get(target.code);
    const taskTypes: PracticeCatalogTask[] = [];

    for (const taskCode of target.taskCodes) {
      const task = taskMap.get(taskCode);
      if (task) {
        taskTypes.push({
          ...task,
          section: target.code,
        });
      }
    }

    const answeredQuestionCount = taskTypes.reduce((acc, t) => acc + (t.answeredQuestionCount || 0), 0);
    const practiceQuestionCount = existing?.practiceQuestionCount ?? taskTypes.length;

    return {
      code: target.code,
      displayName: existing?.displayName ?? target.displayName,
      taskTypes,
      answeredQuestionCount,
      practiceQuestionCount,
    };
  });
}

export function flattenCatalogTasks(sections: PracticeCatalogSection[]): PracticeCatalogTask[] {
  return orderCatalogSections(sections).flatMap((section) => section.taskTypes);
}

function rank(order: ReadonlyArray<string>, value: string): number {
  const index = order.indexOf(value.toUpperCase());
  return index === -1 ? order.length : index;
}
