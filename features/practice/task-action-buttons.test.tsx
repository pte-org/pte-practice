import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { TaskActionButtons } from "./TaskActionButtons";
import { SkillTaskRow } from "./SkillTaskRow";
import type { PracticeCatalogTask } from "./contracts";

import { PREVIEW_CATALOG } from "./preview-catalog";

const baseTask = PREVIEW_CATALOG.sections[0].taskTypes[0];
const sampleTask: PracticeCatalogTask = {
  ...baseTask,
  availability: "RUNNABLE",
  rendererKey: "READ_ALOUD_V1",
  answeredQuestionCount: 5,
  averageScore: 78,
};

const renderWithLocale = (element: React.ReactElement) =>
  renderToStaticMarkup(<LocaleProvider>{element}</LocaleProvider>);

describe("TaskActionButtons", () => {
  it("renders chevron right button when activeSession exists", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={sampleTask}
        activeSession={{ sessionPublicId: "sess-123", answeredItemCount: 2, totalItemCount: 5 }}
        canStart={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("task-chevron-btn");
  });

  it("renders chevron right button when no activeSession exists", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={sampleTask}
        activeSession={null}
        canStart={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("task-chevron-btn");
  });

  it("disables the chevron button when canStart is false", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={sampleTask}
        activeSession={null}
        canStart={false}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("disabled");
  });
});

describe("SkillTaskRow", () => {
  it("renders task name, answered count, score badge, and action buttons", () => {
    const html = renderWithLocale(
      <SkillTaskRow
        task={sampleTask}
        isPracticeUnlocked={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("Read Aloud");
    expect(html).toContain("score-badge");
    expect(html).toContain("skill-task-actions");
  });

  it("shows in-progress indicator when activeSession is provided", () => {
    const html = renderWithLocale(
      <SkillTaskRow
        task={sampleTask}
        isPracticeUnlocked={true}
        activeSession={{ sessionPublicId: "sess-456", answeredItemCount: 3, totalItemCount: 10 }}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("active-session-indicator");
    expect(html).toContain("3/10");
  });

  it("renders LockBadge when practice is locked", () => {
    const html = renderWithLocale(
      <SkillTaskRow
        task={sampleTask}
        isPracticeUnlocked={false}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("state-badge-locked");
  });

  it("hides score-badge when task has no score yet (null)", () => {
    const html = renderWithLocale(
      <SkillTaskRow
        task={{ ...sampleTask, averageScore: null }}
        isPracticeUnlocked={true}
        onStart={vi.fn()}
      />
    );

    expect(html).not.toContain("score-badge");
  });
});
