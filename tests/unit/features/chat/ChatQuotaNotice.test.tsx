import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatQuotaNotice } from "@/features/chat/ChatQuotaNotice";
import type { ChatQuota } from "@/features/chat/contracts";

vi.mock("@/common/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => `${key}:{remaining}` }),
}));

const render = (quota: ChatQuota | null) =>
  renderToStaticMarkup(<ChatQuotaNotice quota={quota} onExpired={() => undefined} />);

describe("ChatQuotaNotice", () => {
  it("renders nothing when the quota is unlimited", () => {
    expect(render({ used: 50, remaining: null, limit: null, resetAt: null, unlimited: true })).toBe("");
  });

  it("shows what is left when a limit is in force", () => {
    const html = render({ used: 5, remaining: 15, limit: 20, resetAt: "2099-01-01T00:00:00Z", unlimited: false });
    expect(html).toContain("chat.quotaLeft");
    expect(html).toContain("15");
  });
});
