import { describe, expect, it } from "vitest";
import { orderCatalogSections, flattenCatalogTasks } from "./catalog-order";
import { PREVIEW_CATALOG } from "./preview-catalog";

describe("practice catalog presentation order", () => {
  it("keeps the complete fallback catalog visible", () => {
    const tasks = flattenCatalogTasks(PREVIEW_CATALOG.sections);

    expect(tasks).toHaveLength(24);
    expect(tasks.find((task) => task.code === "WRITE_EMAIL")?.availability).toBe("UNAVAILABLE");
  });

  it("uses the PTE section and task order", () => {
    const sections = orderCatalogSections(PREVIEW_CATALOG.sections);

    expect(sections.map((section) => section.code)).toEqual([
      "SPEAKING",
      "WRITING",
      "READING",
      "LISTENING",
    ]);
    expect(sections[0]?.taskTypes.slice(0, 4).map((task) => task.code)).toEqual([
      "PERSONAL_INTRODUCTION",
      "READ_ALOUD",
      "REPEAT_SENTENCE",
      "DESCRIBE_IMAGE",
    ]);
  });
});
