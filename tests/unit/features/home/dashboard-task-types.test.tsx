import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/common/i18n";
import { DashboardTaskTypes } from "@/features/home/DashboardPanels";
import { PREVIEW_CATALOG } from "@/features/practice/preview-catalog";
import type { PracticeCatalogSection } from "@/features/practice/contracts";
import { SkillTaskList } from "@/features/catalog/SkillTaskList";

const sections: PracticeCatalogSection[] = PREVIEW_CATALOG.sections.map((section) => ({
  ...section, taskTypes: section.taskTypes.map((task) => ({ ...task, availability: "RUNNABLE" })),
}));
const render = (unlocked: boolean, ready = true): string => renderToStaticMarkup(
  <LocaleProvider><DashboardTaskTypes sections={sections} entries={[]} unlocked={unlocked}
    ready={ready} onStart={vi.fn()} /></LocaleProvider>,
);

describe("home task-type practice", () => {
  it("renders only the selected skill group after canonical task ordering", () => {
    const html = renderToStaticMarkup(<LocaleProvider><SkillTaskList sections={sections}
      sectionCode="SPEAKING" isPracticeUnlocked onStartIntent={vi.fn()} /></LocaleProvider>);
    expect(html.match(/class="card card-flush skill-group"/g)).toHaveLength(1);
    expect(html.match(/class="task-chevron-btn"/g)).toHaveLength(7);
    expect(html).toContain("Read Aloud");
    expect(html).not.toContain("Write Essay");
  });
  it("exposes individual tasks and skill filter tabs rather than skill-start cards", () => {
    const html = render(true);
    expect(html).toContain("Read Aloud");
    expect(html).toContain("Write Essay");
    expect(html.match(/class="task-chevron-btn"/g)).toHaveLength(22);
    expect(html.match(/role="tab"/g)).toHaveLength(5);
    expect(html).toContain('aria-labelledby="dashboard-tasks-tab-ALL"');
    expect(html.match(/class="skill-group-head"/g)).toHaveLength(4);
    expect(html).toContain('id="skill-SPEAKING"');
    expect(html).toContain('id="skill-WRITING"');
    expect(html).toContain('id="skill-READING"');
    expect(html).toContain('id="skill-LISTENING"');
    expect(html).not.toContain('class="ring-root');
    expect(html).not.toContain("answers</span>");
    expect(html).not.toContain("dashboard-skill-action");
  });

  it.each([[false, true], [true, false]])("disables every task start when unlocked=%s and ready=%s", (unlocked, ready) => {
    const html = render(unlocked, ready);
    expect(html.match(/class="task-chevron-btn"[^>]*disabled=""/g)).toHaveLength(22);
  });

  it("does not label catalog reloading as a revoked practice grant", () => {
    const html = render(true, false);
    expect(html).not.toContain("Locked");
    expect(html).toContain("Checking practice access");
  });
});
