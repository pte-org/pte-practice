import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { PracticeApiError } from "@/features/practice/api";
import { NETWORK_ERROR_CODE } from "@/features/practice/constants";
import { en } from "@/common/i18n/en";

const practice = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock("@/features/practice/PracticeProvider", () => ({ usePractice: () => practice.value }));

const { PracticeAccessNotice } = await import("@/features/practice/PracticeAccessNotice");

const render = (error: PracticeApiError | null): string => {
  practice.value = { accessState: "error", catalogStatus: "error", entitlementStatus: "error", refresh: vi.fn(), error };
  return renderToStaticMarkup(<LocaleProvider><PracticeAccessNotice /></LocaleProvider>);
};

describe("PracticeAccessNotice", () => {
  it("names an outage when the server could not be reached", () => {
    const html = render(new PracticeApiError("offline", 0, NETWORK_ERROR_CODE));
    expect(html).toContain(en.ui.serverUnreachable);
    expect(html).not.toContain(en.ui.accessUnknown);
  });

  it("keeps the access message for a server-side failure", () => {
    const html = render(new PracticeApiError("failed", 500, null));
    expect(html).toContain(en.ui.accessUnknown);
  });
});
