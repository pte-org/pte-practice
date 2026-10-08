import { PRACTICE_SECTION_ORDER, PRACTICE_TASK_ORDER } from "./constants";
import type { PracticeCatalogSection, PracticeCatalogTask } from "./contracts";

export function orderCatalogSections(sections: PracticeCatalogSection[]): PracticeCatalogSection[] {
  return [...sections]
    .sort((left, right) => rank(PRACTICE_SECTION_ORDER, left.code) - rank(PRACTICE_SECTION_ORDER, right.code))
    .map((section) => ({
      ...section,
      taskTypes: [...section.taskTypes].sort(
        (left, right) => rank(PRACTICE_TASK_ORDER, left.code) - rank(PRACTICE_TASK_ORDER, right.code),
      ),
    }));
}

export function flattenCatalogTasks(sections: PracticeCatalogSection[]): PracticeCatalogTask[] {
  return orderCatalogSections(sections).flatMap((section) => section.taskTypes);
}

function rank(order: ReadonlyArray<string>, value: string): number {
  const index = order.indexOf(value.toUpperCase());
  return index === -1 ? order.length : index;
}
