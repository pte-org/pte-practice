import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { ThemeProvider } from "@/common/providers/ThemeProvider";
import { StudentSettings } from "@/features/settings/StudentSettings";
import { GeneralSettings } from "@/features/settings/GeneralSettings";
import { AppearanceSettings } from "@/features/practice/appearance/AppearanceSettings";
import { DEFAULT_APPEARANCE } from "@/features/practice/appearance/preferences";

describe("student settings", () => {
  it("exposes one labeled gear button that opens a dialog instead of separate language/theme actions", () => {
    const html = renderToStaticMarkup(<LocaleProvider><StudentSettings /></LocaleProvider>);
    expect(html).toContain('aria-label="Settings"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain("Toggle language");
    expect(html).not.toContain("Toggle theme");
  });

  it("offers explicit language and theme choices with checked states from the existing providers", () => {
    const html = renderToStaticMarkup(<ThemeProvider><LocaleProvider><GeneralSettings /></LocaleProvider></ThemeProvider>);
    expect(html.match(/role="radiogroup"/g)).toHaveLength(2);
    expect(html.match(/checked=""/g)).toHaveLength(2);
    for (const label of ["English", "Tiếng Việt", "Light", "Dark"]) expect(html).toContain(label);
  });

  it("embeds background controls directly without creating a second dialog", () => {
    const html = renderToStaticMarkup(<LocaleProvider><AppearanceSettings value={DEFAULT_APPEARANCE} /></LocaleProvider>);
    expect(html).toContain('type="file"');
    expect(html).toContain("Panel opacity");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("practice-appearance-trigger");
  });
});
