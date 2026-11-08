import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingState } from "@/common/components/LoadingState";

describe("LoadingState", () => {
  it("renders a labelled skeleton region without the legacy spinner", () => {
    const markup = renderToStaticMarkup(<LoadingState message="Loading workspace" />);
    expect(markup).toContain('aria-label="Loading workspace"');
    expect(markup).not.toContain('aria-busy="true"');
    expect(markup).toContain("common-skeleton");
    expect(markup).not.toContain("loading-dot");
    expect(markup).toContain('class="common-loading-label">Loading workspace</span>');
  });

  it("uses compact placeholders for embedded loading regions", () => {
    const markup = renderToStaticMarkup(<LoadingState compact message="Scoring" />);
    expect(markup).toContain("common-loading-skeleton-compact");
    expect(markup).not.toContain("common-loading-skeleton-card");
  });
});
