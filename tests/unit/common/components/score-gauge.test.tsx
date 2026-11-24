import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ScoreGauge } from "@/common/components";

const limits = { low: 40, high: 70 };
const render = (value: number, drawnValue?: number): string => renderToStaticMarkup(
  <ScoreGauge label="Score" value={value} drawnValue={drawnValue} limits={limits}>
    <strong>{value}</strong>
  </ScoreGauge>,
);

describe("ScoreGauge", () => {
  it("is a named meter that reports its value", () => {
    const html = render(50);
    expect(html).toContain("role=\"meter\"");
    expect(html).toContain("aria-label=\"Score\"");
    expect(html).toContain("aria-valuenow=\"50\"");
    expect(html).toContain("aria-valuemax=\"100\"");
  });

  it("shows what it is given in the middle", () => {
    expect(render(50)).toContain("<strong>50</strong>");
  });

  it("takes the tone of the score", () => {
    expect(render(20)).toContain("score-gauge-tone-low");
    expect(render(55)).toContain("score-gauge-tone-mid");
    expect(render(70)).toContain("score-gauge-tone-high");
  });

  it("draws the value it runs up to, while still reporting the real score", () => {
    const html = render(80, 20);
    expect(html).toContain("score-gauge-tone-low");
    expect(html).toContain("aria-valuenow=\"80\"");
  });

  it("has no filled arc at zero and no zone names", () => {
    const html = render(0);
    expect(html).not.toContain("score-gauge-fill");
    expect(html).not.toContain("<text");
  });

  it("draws no inline style, so it follows the theme", () => {
    expect(render(50)).not.toContain("style=");
  });

  it("clamps the reported value into its range", () => {
    expect(render(140)).toContain("aria-valuenow=\"100\"");
    expect(render(-5)).toContain("aria-valuenow=\"0\"");
  });
});
