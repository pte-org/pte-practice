import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { DashboardRecommendations } from "@/features/home/DashboardPanels";
import { PREVIEW_CATALOG } from "@/features/practice/preview-catalog";
import { flattenCatalogTasks } from "@/features/practice/catalog-order";
import { selectResumeCards, type Recommendation } from "@/features/home/recommendations";

const disclosure = vi.hoisted(() => ({ display: "preview" as "preview" | "expanded" | "collapsed" }));
// Render all disclosure states using real React hooks without requiring browser automation.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: function useState(initial: unknown) {
    const state = actual.useState(initial);
    return initial === "preview" ? [disclosure.display, state[1]] : state;
  } };
});

const sections = PREVIEW_CATALOG.sections;
const cards: Recommendation[] = flattenCatalogTasks(sections).map((task, index) => ({
  id: `session:${index}`, taskCode: task.code, title: task.displayName,
  description: "4/10", itemCount: 10, minutes: null,
  progress: { done: 4, total: 10 }, action: "continue",
  target: { type: "href", href: `/practice-tests/session?sessionId=${index}` },
}));
const render = (items: Recommendation[], state: "loading" | "ready" | "error" = "ready"): string =>
  renderToStaticMarkup(<LocaleProvider><DashboardRecommendations cards={items} sections={sections}
    state={state} /></LocaleProvider>);

describe("dashboard resume disclosure", () => {
  beforeEach(() => { disclosure.display = "preview"; });

  it("hides every card and the skill tabs after collapsing, while keeping the reopen button", () => {
    disclosure.display = "collapsed";
    const html = render(cards.slice(0, 6));
    expect(html).toContain('id="dashboard-resume-content" class="resume-content" hidden=""');
    expect(html).not.toContain("<article");
    expect(html).not.toContain('role="tablist"');
    expect(html).toContain("View all");
    expect(html).toContain('aria-expanded="false"');
  });

  it("shows the full list and skill tabs when expanded", () => {
    disclosure.display = "expanded";
    const html = render(cards.slice(0, 6));
    expect(html.match(/<article /g)).toHaveLength(6);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Show less");
  });
  it.each(["loading", "ready", "error"] as const)("hides the section without unfinished tasks in %s state", (state) => {
    expect(render([], state)).toBe("");
  });

  it("features the latest task once and previews only four more out of 22", () => {
    const html = render(cards);
    expect(cards).toHaveLength(22);
    expect(html.match(/<article /g)).toHaveLength(5);
    expect(html.match(/resume-item-featured/g)).toHaveLength(1);
    expect(html).toContain("View all");
    expect(html).toContain('class="resume-count">22</span>');
    expect(html).toContain('class="pte-button resume-toggle"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="dashboard-resume-content"');
    expect(html.match(/sessionId=0"/g)).toHaveLength(1);
    expect(html).not.toContain("sessionId=5");
  });

  it("does not show an expansion control when all sessions already fit", () => {
    expect(render(cards.slice(0, 1)).match(/<article /g)).toHaveLength(1);
    const html = render(cards.slice(0, 5));
    expect(html.match(/<article /g)).toHaveLength(5);
    expect(html).not.toContain("aria-expanded");
  });

  it("expands all 22 sessions in recent order and filters by canonical skill membership", () => {
    expect(selectResumeCards(cards, sections, true, "ALL")).toEqual(cards);
    const speaking = selectResumeCards(cards, sections, true, "SPEAKING");
    const writing = selectResumeCards(cards, sections, true, "WRITING");
    expect(speaking).toHaveLength(7);
    expect(writing).toHaveLength(4);
    expect(writing.map((card) => card.taskCode)).toContain("WRITE_FROM_DICTATION");
    expect(speaking.map((card) => card.taskCode)).not.toContain("WRITE_FROM_DICTATION");
    expect(selectResumeCards(speaking, sections, true, "WRITING")).toEqual([]);
    expect(selectResumeCards(cards, sections, false, "WRITING")).toEqual(cards.slice(1, 5));
  });
});
