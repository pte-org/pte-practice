import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { fixtureForTask } from "@/features/practice/fixtures";
import { BlankRenderer } from "@/features/practice/renderers/BlankRenderer";
import type { PracticeOptionVerdict } from "@/features/practice/result-contracts";

const verdicts: PracticeOptionVerdict[] = [
  { orderIndex: 0, selected: true, correct: true, blankIndex: 0, text: "reliable" },
  { orderIndex: 1, selected: false, correct: false, blankIndex: 0, text: "rare" },
  { orderIndex: 2, selected: false, correct: true, blankIndex: 1, text: "easy" },
  { orderIndex: 3, selected: true, correct: false, blankIndex: 1, text: "complex" },
];

const render = (marked: boolean): string => renderToStaticMarkup(
  <LocaleProvider>
    <BlankRenderer fixture={fixtureForTask("FILL_IN_THE_BLANKS_DROPDOWN")}
      value={{ selections: { "0": "reliable", "1": "complex" } }} disabled onChange={() => undefined}
      verdicts={marked ? verdicts : []} />
  </LocaleProvider>,
);

describe("BlankRenderer verdicts", () => {
  it("leaves the gaps plain while the answer has no verdicts", () => {
    const html = render(false);
    expect(html).not.toContain("task-blank-right");
    expect(html).not.toContain("task-blank-wrong");
  });

  it("tints the right gap and the wrong one, and names the word that belonged in the wrong one", () => {
    const html = render(true);
    expect(html.match(/task-blank-right/g)).toHaveLength(1);
    expect(html.match(/task-blank-wrong"/g)).toHaveLength(1);
    expect(html).toContain("task-blank-mark-wrong");
    expect(html).toContain("<em>easy</em>");
    expect(html).not.toContain("<em>reliable</em>");
  });
});
