import type { PracticeTaskFixture } from "./fixtures";
import type { PracticeTaskResponse } from "./contracts";

const TEXT_PROMPT_TASKS = new Set(["READ_ALOUD", "SUMMARIZE_WRITTEN_TEXT"]);

/** Converts the server-owned question projection into the existing renderer shape. */
export function fixtureFromPracticeTask(task: Pick<PracticeTaskResponse, "taskCode" | "content">): PracticeTaskFixture | null {
  const content = task.content;
  if (!content) return null;
  const prompt = content.promptText?.trim() ?? "";
  const audioExpected = Boolean(content.audioPromptRef || content.audioUrl);
  const imageExpected = Boolean(content.imagePromptRef || content.imageUrl);
  if (!prompt && !audioExpected && !imageExpected && content.options.length === 0) return null;

  const sorted = content.options.slice().sort((left, right) => left.orderIndex - right.orderIndex);
  const options = sorted.map((option) => ({ id: String(option.orderIndex), label: option.text }));
  const isBlankTask = task.taskCode.startsWith("FILL_IN_THE_BLANKS_");

  const fixture: PracticeTaskFixture = {
    taskCode: task.taskCode,
    prompt,
    audioUrl: content.audioUrl ?? null,
    imageUrl: content.imageUrl ?? null,
    audioExpected,
    imageExpected,
  };

  if (TEXT_PROMPT_TASKS.has(task.taskCode) || isBlankTask) fixture.text = prompt;
  if (content.minWordCount != null) fixture.minWords = content.minWordCount;
  if (content.maxWordCount != null) fixture.maxWords = content.maxWordCount;

  if (task.taskCode === "RE_ORDER_PARAGRAPHS") {
    fixture.paragraphs = options.map((option) => ({ id: option.id, text: option.label }));
  } else if (isBlankTask) {
    fixture.blankOptions = options.map((option) => option.label);
    const byIndex = groupByBlankIndex(sorted);
    if (byIndex) fixture.blankOptionsByIndex = byIndex;
  } else if (options.length > 0) {
    fixture.options = options;
  }

  if (task.taskCode === "HIGHLIGHT_INCORRECT_WORDS") {
    // Word positions are the answer: the server splits the passage on whitespace with punctuation attached.
    fixture.tokens = prompt.split(/\s+/).filter(Boolean).map((text, index) => ({ id: String(index), text }));
  }
  return fixture;
}

function groupByBlankIndex(options: ReadonlyArray<{ text: string; blankIndex: number | null }>): Record<string, string[]> | null {
  if (!options.some((option) => option.blankIndex != null)) return null;
  const grouped: Record<string, string[]> = {};
  for (const option of options) {
    if (option.blankIndex == null) continue;
    (grouped[String(option.blankIndex)] ??= []).push(option.text);
  }
  return grouped;
}
