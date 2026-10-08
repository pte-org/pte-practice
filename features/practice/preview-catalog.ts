import type { PracticeCatalog, PracticeCatalogTask } from "./contracts";
import { PREVIEW_TASKS, PRACTICE_SECTION_ORDER } from "./constants";

export const PREVIEW_CATALOG: PracticeCatalog = {
  productCode: "PTE_CORE_PRACTICE",
  title: "PTE Core Practice",
  catalogVersion: "shell-preview",
  timeLimitSeconds: 0,
  sections: PRACTICE_SECTION_ORDER.map((section) => ({
    code: section,
    displayName: section.charAt(0) + section.slice(1).toLowerCase(),
    taskTypes: PREVIEW_TASKS.filter((task) => task.section === section).map((task): PracticeCatalogTask => ({
      code: task.code,
      displayName: task.displayName,
      section: task.section,
      scored: task.scored,
      availability: task.availability,
      unavailableReason: task.unavailableReason,
      profileKey: null,
      profileVersion: null,
      rendererKey: null,
      contractVersion: null,
      answerSchemaVersion: null,
      requiredClientCapabilities: [],
      contentStatus: "SHELL_PREVIEW",
      provenance: "LOCAL_SHELL_PREVIEW",
    })),
  })).filter((section) => section.taskTypes.length > 0),
};
