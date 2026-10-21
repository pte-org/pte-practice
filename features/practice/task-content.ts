import type { PracticeTaskFixture } from "./fixtures";
import type { PracticeTaskResponse } from "./contracts";

/** Converts the server-owned question projection into the existing renderer shape. */
export function fixtureFromPracticeTask(task: Pick<PracticeTaskResponse, "taskCode" | "content">): PracticeTaskFixture | null {
  const content = task.content;
  const prompt = content?.promptText?.trim();
  if (!content || !prompt) return null;

  const options = content.options
    .slice()
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((option) => ({ id: String(option.orderIndex), label: option.text }));

  const fixture: PracticeTaskFixture = {
    taskCode: task.taskCode,
    prompt,
  };

  if (task.taskCode === "READ_ALOUD" || task.taskCode.startsWith("FILL_IN_THE_BLANKS_"
    ) || task.taskCode === "SUMMARIZE_WRITTEN_TEXT") {
    fixture.text = prompt;
  }
  if (options.length > 0) fixture.options = options;
  if (task.taskCode === "RE_ORDER_PARAGRAPHS") {
    fixture.paragraphs = options.map((option) => ({ id: option.id, text: option.label }));
  }
  if (task.taskCode.startsWith("FILL_IN_THE_BLANKS_")) {
    fixture.blankOptions = options.map((option) => option.label);
  }
  if (task.taskCode === "HIGHLIGHT_INCORRECT_WORDS") {
    fixture.tokens = prompt.split(/\s+/).filter(Boolean).map((text, index) => ({ id: `t${index}`, text }));
  }
  return fixture;
}
