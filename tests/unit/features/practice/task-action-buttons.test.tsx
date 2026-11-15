import { ICON_PATHS } from "@/common/components/icon-paths";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { TaskActionButtons } from "@/features/practice/TaskActionButtons";
import { SkillTaskRow } from "@/features/practice/SkillTaskRow";
import type { PracticeCatalogTask } from "@/features/practice/contracts";

import { PREVIEW_CATALOG } from "@/features/practice/preview-catalog";

const baseTask = PREVIEW_CATALOG.sections[0].taskTypes[0];
const sampleTask: PracticeCatalogTask = {
  ...baseTask,
  availability: "RUNNABLE",
  rendererKey: "READ_ALOUD_V1",
  answeredQuestionCount: 5,
  availableQuestionCount: 20,
  averageScore: 78,
};

const renderWithLocale = (element: React.ReactElement) =>
  renderToStaticMarkup(<LocaleProvider>{element}</LocaleProvider>);

describe("TaskActionButtons", () => {
  it("labels the main action Continue and links to the live session", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={sampleTask}
        activeSession={{ sessionPublicId: "sess-123", answeredItemCount: 2, totalItemCount: 5 }}
        canStart={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("task-primary-action");
    expect(html).toContain(">Continue<");
    expect(html).toContain("sessionId=sess-123");
    expect(html).toContain("pte-button task-new-set-button");
    expect(html).not.toContain('role="dialog"');
  });

  it("labels the main action Practise when nothing was done yet", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={sampleTask}
        activeSession={null}
        canStart={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain("task-primary-action");
    expect(html).toContain(">Practise<");
  });

  it("offers Keep practising while some questions of the task type are still unanswered", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={sampleTask}
        activeSession={null}
        completedSession={{ sessionPublicId: "sess-completed", answeredItemCount: 5, totalItemCount: 5, score: 85 }}
        canStart={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain(">Keep practising<");
    expect(html).not.toContain(">Practise again<");
  });

  it("offers Review and Practise again once every question is answered", () => {
    const html = renderWithLocale(
      <TaskActionButtons
        task={{ ...sampleTask, answeredQuestionCount: 20 }}
        activeSession={null}
        completedSession={{ sessionPublicId: "sess-completed", answeredItemCount: 10, totalItemCount: 10, score: 85 }}
        canStart={true}
        onStart={vi.fn()}
      />
    );

    expect(html).toContain(">Review<");
    expect(html).toContain(">Practise again<");
    expect(html).toContain("sessionId=sess-completed");
    // Starting over shows the circular retake icon instead of the arrow.
    expect(html).toContain(ICON_PATHS.retake);
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
