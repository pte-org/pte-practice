import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeBackground } from "@/features/practice/appearance/PracticeBackground";
import { DEFAULT_APPEARANCE } from "@/features/practice/appearance/preferences";

describe("shared home and session background", () => {
  it("hides the scene in default and focus modes", () => {
    expect(renderToStaticMarkup(<PracticeBackground value={{ ...DEFAULT_APPEARANCE, background: "default" }} />)).toBe("");
    expect(renderToStaticMarkup(<PracticeBackground value={{ ...DEFAULT_APPEARANCE, background: "ocean", focus: true }} />)).toBe("");
  });

  it("keeps a preset decorative and does not request a remote image", () => {
    const html = renderToStaticMarkup(<PracticeBackground value={{ ...DEFAULT_APPEARANCE, background: "ocean" }} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<img");
  });

  it("renders a local image without sending it through the image optimizer", () => {
    const html = renderToStaticMarkup(<PracticeBackground value={{ ...DEFAULT_APPEARANCE, background: "custom", image: "data:image/jpeg;base64,YWJj" }} />);
    expect(html).toContain('alt=""');
    expect(html).toContain("data:image/jpeg;base64,YWJj");
    expect(html).not.toContain("/_next/image");
  });
});
