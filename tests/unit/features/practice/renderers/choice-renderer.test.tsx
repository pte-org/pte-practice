import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { en } from "@/common/i18n/en";
import { fixtureForTask } from "@/features/practice/fixtures";
import { ChoiceRenderer } from "@/features/practice/renderers/ChoiceRenderer";
import type { PracticeOptionVerdict } from "@/features/practice/result-contracts";

const fixture = {
  ...fixtureForTask("MC_READING_MULTIPLE"),
  options: [
    { id: "0", label: "right pick" }, { id: "1", label: "wrong pick" },
    { id: "2", label: "right left out" }, { id: "3", label: "wrong left out" },
  ],
};
const answer = { selectedOptions: ["0", "1"] };

const render = (verdicts?: PracticeOptionVerdict[]): string => renderToStaticMarkup(
  <LocaleProvider>
    <ChoiceRenderer fixture={fixture} value={answer} disabled onChange={() => undefined} verdicts={verdicts} />
  </LocaleProvider>,
);

describe("ChoiceRenderer verdicts", () => {
  it("shows only the picked state while the answer has no verdicts", () => {
    const html = render();
    expect(html).toContain("task-choice-selected");
    expect(html).not.toContain("task-choice-right");
    expect(html).not.toContain("task-choice-wrong");
    expect(html).not.toContain("task-choice-outcome");
  });

  it("marks each option right, wrong or missed, with a word as well as a colour", () => {
    const html = render([
      { orderIndex: 0, selected: true, correct: true }, { orderIndex: 1, selected: true, correct: false },
      { orderIndex: 2, selected: false, correct: true }, { orderIndex: 3, selected: false, correct: false },
    ]);
    expect(html.match(/task-choice-right/g)).toHaveLength(1);
    expect(html.match(/task-choice-wrong/g)).toHaveLength(1);
    expect(html.match(/task-choice-missed/g)).toHaveLength(1);
    expect(html).toContain(en.session.correct);
    expect(html).toContain(en.session.incorrect);
    expect(html).toContain(en.session.rightAnswer);
    expect(html).toContain(en.session.partiallyCorrect);
    expect(html).not.toContain("task-choice-selected");
  });

  it("says correct above the options when every pick is right and none is left out", () => {
    const html = render([{ orderIndex: 0, selected: true, correct: true },
      { orderIndex: 1, selected: true, correct: true }, { orderIndex: 2, selected: false, correct: false },
      { orderIndex: 3, selected: false, correct: false }]);
    expect(html).toContain("task-choice-outcome-correct");
  });
});
