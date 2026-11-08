import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { PipArtwork } from "@/features/mascot/PipArtwork";
import { PIP_LAYERS } from "@/features/mascot/constants";
import { PipCompanion } from "@/features/mascot/PipCompanion";
import { ChatLauncherContext } from "@/features/chat/ChatLauncher";
import { LocaleProvider } from "@/common/i18n";

describe("Pip layered puppet", () => {
  it("offers the existing chat launcher instead of a separate canned conversation", () => {
    const html = renderToStaticMarkup(<LocaleProvider><ChatLauncherContext value={{ open: vi.fn() }}>
      <PipCompanion />
    </ChatLauncherContext></LocaleProvider>);
    expect(html).toContain('aria-label="Open AI assistant"');
    expect(html).not.toContain("pip-speech-bubble");
    expect(html).not.toContain("Tap Pip");
    expect(html).not.toContain("Which task shall");
  });
  it("ships transparent body, wing and eyelid cutouts", async () => {
    expect(Object.keys(PIP_LAYERS)).toHaveLength(4);
    for (const src of Object.values(PIP_LAYERS)) {
      const asset = fileURLToPath(new URL(`../../../../public${src}`, import.meta.url));
      const metadata = await sharp(asset).metadata();
      expect(metadata.hasAlpha).toBe(true);
      expect(metadata.width).toBeGreaterThan(100);
      expect(metadata.height).toBeGreaterThan(100);
      const stats = await sharp(asset).stats();
      expect(stats.channels[3].min).toBe(0);
      expect(stats.channels[3].max).toBe(255);
    }
  });

  it("uses exactly the same fixed body for resting and greeting poses", () => {
    const resting = renderToStaticMarkup(<PipArtwork />);
    const greeting = renderToStaticMarkup(<PipArtwork animate greeting />);
    const body = (html: string): string | undefined => html.match(/<image class="pip-body-fixed"[^>]*>/)?.[0];
    expect(body(resting)).toContain(PIP_LAYERS.body);
    expect(body(greeting)).toBe(body(resting));
    expect(greeting).toContain("pip-wing-joint");
    expect(greeting).toContain("pip-eyelid-left");
    expect(greeting).toContain("pip-mouth-joint");
    expect(greeting.match(new RegExp(PIP_LAYERS.body, "g"))).toHaveLength(2);
    expect(greeting).not.toContain("pip-beak-joint");
    expect(greeting).not.toContain("beak.png");
    expect(greeting).toContain('class="pip-facing-right" transform="translate(640 0) scale(-1 1)"');
    expect(greeting).not.toContain("frame-00");
  });

  it("gives sidebar and chat instances independent eye clips", () => {
    const html = renderToStaticMarkup(<><PipArtwork /><PipArtwork className="pip-chat-avatar" /></>);
    const ids = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
  });
});
