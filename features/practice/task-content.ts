import type { PracticeTaskFixture } from "./fixtures";
import type { PracticeTaskResponse } from "./contracts";
import { seededShuffle } from "./seeded-shuffle";

const TEXT_PROMPT_TASKS = new Set(["READ_ALOUD", "SUMMARIZE_WRITTEN_TEXT"]);

/**
 * Converts the server-owned question projection into the existing renderer shape. The server lists re-order
 * paragraphs and blank options in answer order, so they are shuffled here with a seed (the question id) that keeps
 * the order stable across reloads.
 */
export function fixtureFromPracticeTask(
  task: Pick<PracticeTaskResponse, "taskCode" | "content"> & { publicId?: string },
): PracticeTaskFixture | null {
  const content = task.content;
  if (!content) return null;
  const prompt = content.promptText?.trim() ?? "";
  const audioExpected = Boolean(content.audioPromptRef || content.audioUrl);
  const imageExpected = Boolean(content.imagePromptRef || content.imageUrl);
  if (!prompt && !audioExpected && !imageExpected && content.options.length === 0) return null;

  const seed = task.publicId ?? task.taskCode;
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
    const paragraphs = options.map((option) => ({ id: option.id, text: option.label }));
    fixture.paragraphs = seededShuffle(paragraphs, seed, { avoidOriginal: true });
  } else if (isBlankTask) {
    fixture.blankOptions = seededShuffle(options.map((option) => option.label), seed);
    const byIndex = groupByBlankIndex(sorted, seed);
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

function groupByBlankIndex(
  options: ReadonlyArray<{ text: string; blankIndex: number | null }>, seed: string,
): Record<string, string[]> | null {
  if (!options.some((option) => option.blankIndex != null)) return null;
  const grouped: Record<string, string[]> = {};
  for (const option of options) {
    if (option.blankIndex == null) continue;
    (grouped[String(option.blankIndex)] ??= []).push(option.text);
  }
  for (const [blank, words] of Object.entries(grouped)) grouped[blank] = seededShuffle(words, `${seed}:${blank}`);
  return grouped;
}
