import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ChatLayout } from "@/features/chat/ChatLayout";
import { useChatLauncher } from "@/features/chat/ChatLauncher";

const quota = vi.hoisted(() => ({ refresh: vi.fn(async () => {}) }));

vi.mock("@/features/chat/chat-flag", () => ({ CHAT_ENABLED: true }));
vi.mock("@/features/chat/chat-open-state", () => ({
  readChatOpen: () => false,
  chatSessionStorage: () => null,
  writeChatOpen: vi.fn(),
}));
vi.mock("@/features/chat/useChatQuota", () => ({
  useChatQuota: () => ({ quota: null, setQuota: vi.fn(), refresh: quota.refresh, unavailable: false, errorKey: null }),
}));

function LauncherProbe() {
  return <span data-launcher={useChatLauncher() ? "yes" : "no"}>exercise</span>;
}

describe("ChatLayout enabled prop", () => {
  it("renders only the exercise, with no launcher and no chat box, when disabled (mock test)", () => {
    const html = renderToStaticMarkup(
      <ChatLayout taskCode="WRITE_ESSAY" exercisePrompt="Write about cities." enabled={false}><LauncherProbe /></ChatLayout>,
    );
    expect(html).toBe('<span data-launcher="no">exercise</span>');
    expect(quota.refresh).not.toHaveBeenCalled();
  });

  it("still offers the launcher by default", () => {
    const html = renderToStaticMarkup(
      <ChatLayout taskCode="WRITE_ESSAY"><LauncherProbe /></ChatLayout>,
    );
    expect(html).toContain('data-launcher="yes"');
    expect(html).toContain("chat-layout");
  });
});
