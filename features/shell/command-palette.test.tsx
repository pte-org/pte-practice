import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { ToastProvider } from "@/common/components/Toast";
import { ThemeProvider } from "@/common/providers/ThemeProvider";
import { PracticeProvider } from "@/features/practice/PracticeProvider";
import { CommandPalette } from "./CommandPalette";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const renderWithProviders = (element: React.ReactElement) =>
  renderToStaticMarkup(
    <ThemeProvider>
      <LocaleProvider>
        <ToastProvider>
          <PracticeProvider>{element}</PracticeProvider>
        </ToastProvider>
      </LocaleProvider>
    </ThemeProvider>,
  );

describe("CommandPalette", () => {
  it("renders nothing when open is false", () => {
    const html = renderWithProviders(<CommandPalette open={false} onClose={vi.fn()} />);
    expect(html).toBe("");
  });

  it("renders search input, navigation items and quick actions when open is true", () => {
    const html = renderWithProviders(<CommandPalette open={true} onClose={vi.fn()} />);
    expect(html).toContain("command-palette-dialog");
    expect(html).toContain("command-palette-input");
    expect(html).toContain("command-palette-item");
    expect(html).toContain("Skill practice");
  });
});
