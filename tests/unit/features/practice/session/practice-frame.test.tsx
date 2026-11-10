import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { PracticeFrame } from "@/features/practice/session/PracticeFrame";
import { PracticeSupport } from "@/features/practice/session/PracticeSupport";
import { SessionSkeleton } from "@/features/practice/session/SessionSkeleton";
import { ChatLauncherContext } from "@/features/chat/ChatLauncher";

describe("common practice frame", () => {
  it("keeps the question, support and action slots inside the same workspace", () => {
    const html = renderToStaticMarkup(<LocaleProvider><PracticeFrame header={<header>Session</header>} sidebar={<aside>Support</aside>}
      footer={<button>Submit</button>}><article>Question</article></PracticeFrame></LocaleProvider>);
    expect(html).toContain('data-testid="practice-session"');
    expect(html).toContain('aria-busy="false"');
    expect(html).toContain("Question");
    expect(html).toContain("Support");
    expect(html).toContain("Submit");
  });

  it("announces loading once and hides decorative skeleton shapes from assistive technology", () => {
    const html = renderToStaticMarkup(<LocaleProvider><SessionSkeleton /></LocaleProvider>);
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<button");
  });

  it("uses task guidance without offering unavailable AI or invented question hints", () => {
    const html = renderToStaticMarkup(<LocaleProvider><PracticeSupport taskCode="READ_ALOUD" /></LocaleProvider>);
    expect(html).toContain("pronunciation");
    expect(html).not.toContain("Ask AI");
  });

  it("offers the existing AI launcher only when the surrounding chat feature provides it", () => {
    const html = renderToStaticMarkup(<LocaleProvider><ChatLauncherContext value={{ open: vi.fn() }}>
      <PracticeSupport taskCode="READ_ALOUD" hints={<p>Question-specific hint</p>} />
    </ChatLauncherContext></LocaleProvider>);
    expect(html).toContain("Ask AI");
    expect(html).toContain("Question-specific hint");
  });
});
