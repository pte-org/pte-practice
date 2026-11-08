import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/common/i18n";
import { ChatLayout } from "@/features/chat/ChatLayout";
import { useChatLauncher } from "@/features/chat/ChatLauncher";
import { PipCompanion } from "@/features/mascot/PipCompanion";

const scenario = vi.hoisted(() => ({
  open: false,
  unavailable: true,
  errorKey: "accessDenied" as "accessDenied" | "unavailable" | null,
  refresh: vi.fn(async () => {}),
}));

// Read the chosen tab state without a browser; all other React hooks and components remain real.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
vi.mock("@/features/chat/chat-flag", () => ({ CHAT_ENABLED: true }));
vi.mock("@/features/chat/chat-open-state", () => ({
  readChatOpen: () => scenario.open,
  chatSessionStorage: () => null,
  writeChatOpen: vi.fn(),
}));
vi.mock("@/features/chat/useChatQuota", () => ({
  useChatQuota: () => ({
    quota: null,
    setQuota: vi.fn(),
    refresh: scenario.refresh,
    unavailable: scenario.unavailable,
    errorKey: scenario.errorKey,
  }),
}));

function SidebarPip(): ReactElement {
  const launcher = useChatLauncher();
  return <div data-chat-connected={launcher !== null}><PipCompanion /></div>;
}
function renderWorkspace(): string {
  return renderToStaticMarkup(<LocaleProvider><ChatLayout taskCode={null}><SidebarPip /></ChatLayout></LocaleProvider>);
}

describe("Pip chat availability recovery", () => {
  beforeEach(() => {
    scenario.open = false;
    scenario.unavailable = true;
    scenario.errorKey = "accessDenied";
  });

  it("keeps Pip connected to the chat launcher after quota is forbidden", () => {
    const html = renderWorkspace();
    expect(html).toContain('data-chat-connected="true"');
    expect(html).toContain('aria-label="Open AI assistant"');
    expect(html).not.toContain('class="chat-toggle"');
  });

  it.each(["accessDenied", "unavailable"] as const)("keeps the opened panel visible for %s with retry and a blocked composer", (errorKey) => {
    scenario.open = true;
    scenario.errorKey = errorKey;
    const html = renderWorkspace();
    expect(html).toContain('data-open="true"');
    expect(html).toContain('class="chat-panel"');
    expect(html).not.toMatch(/class="chat-panel"[^>]*hidden/);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Try again");
    expect(html).toMatch(/<textarea[^>]*disabled/);
    expect(html).toMatch(/disabled[^>]*class="[^"]*chat-send/);
    expect(html).not.toContain('class="chat-suggestion"');
  });

  it("restores the composer when a quota retry succeeds without closing the panel", () => {
    scenario.open = true;
    scenario.unavailable = false;
    scenario.errorKey = null;
    const html = renderWorkspace();
    expect(html).toContain('class="chat-panel"');
    expect(html).not.toMatch(/<textarea[^>]*disabled/);
    expect(html).not.toContain('role="alert"');
  });
});
