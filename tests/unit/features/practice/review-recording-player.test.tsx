import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/common/i18n";
import { ReviewRecordingPlayer } from "@/features/practice/ReviewRecordingPlayer";

describe("ReviewRecordingPlayer", () => {
  it("starts with a listen button and does not ask for the short-lived recording link until it is pressed", () => {
    const getRecordingPlayback = vi.fn();
    const html = renderToStaticMarkup(
      <LocaleProvider>
        <ReviewRecordingPlayer api={{ getRecordingPlayback }} sessionId="session-1" itemId="item-1" />
      </LocaleProvider>,
    );

    expect(html).toContain("<button");
    expect(html).toContain("Listen to your recording");
    expect(html).not.toContain("<audio");
    expect(html).not.toContain('role="alert"');
    expect(getRecordingPlayback).not.toHaveBeenCalled();
  });
});
