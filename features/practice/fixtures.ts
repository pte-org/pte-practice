export interface ChoiceOption {
  id: string;
  label: string;
}

export interface PracticeTaskFixture {
  taskCode: string;
  prompt: string;
  instruction?: string;
  options?: ChoiceOption[];
  paragraphs?: { id: string; text: string }[];
  tokens?: { id: string; text: string }[];
  text?: string;
  /** Shared word bank (drag and drop). */
  blankOptions?: string[];
  /** Per-gap choices keyed by gap index (dropdown). */
  blankOptionsByIndex?: Record<string, string[]>;
  audioUrl?: string | null;
  imageUrl?: string | null;
  /** The question references prompt media; a missing URL then means the media failed to load. */
  audioExpected?: boolean;
  imageExpected?: boolean;
  minWords?: number | null;
  maxWords?: number | null;
}

const fixtures: Record<string, PracticeTaskFixture> = {
  READ_ALOUD: {
    taskCode: "READ_ALOUD",
    prompt: "Read the text aloud when you are ready.",
    instruction: "Check your microphone, then record your response.",
    text: "Regular practice helps learners build confidence and communicate their ideas more clearly.",
  },
  MC_READING_SINGLE: {
    taskCode: "MC_READING_SINGLE",
    prompt: "Read the text and choose the best answer.",
    instruction: "Select one response.",
    options: [
      { id: "0", label: "It explains a recent change." },
      { id: "1", label: "It compares two travel options." },
      { id: "2", label: "It describes a scientific process." },
      { id: "3", label: "It gives instructions for a new service." },
    ],
  },
  MC_READING_MULTIPLE: {
    taskCode: "MC_READING_MULTIPLE",
    prompt: "Which statements are supported by the passage?",
    instruction: "Select all correct responses.",
    options: [
      { id: "0", label: "The project began as a local experiment." },
      { id: "1", label: "The team measured results over time." },
      { id: "2", label: "The project was cancelled immediately." },
      { id: "3", label: "The findings changed the final plan." },
    ],
  },
  RE_ORDER_PARAGRAPHS: {
    taskCode: "RE_ORDER_PARAGRAPHS",
    prompt: "Re-order the paragraphs to create a logical passage.",
    paragraphs: [
      { id: "0", text: "As a result, the library extended its opening hours." },
      { id: "1", text: "The community survey showed that many readers worked late." },
      { id: "2", text: "The library then reviewed its schedule and staffing." },
      { id: "3", text: "The change made evening visits much more convenient." },
    ],
  },
  FILL_IN_THE_BLANKS_DRAG_AND_DROP: {
    taskCode: "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
    prompt: "Complete the text by placing each word in the correct blank.",
    text: "Good planning can {{0}} uncertainty and make a project more {{1}}.",
    blankOptions: ["reduce", "efficient", "increase", "difficult"],
  },
  FILL_IN_THE_BLANKS_DROPDOWN: {
    taskCode: "FILL_IN_THE_BLANKS_DROPDOWN",
    prompt: "Choose the best word for each blank.",
    text: "Public transport is {{0}} when services are frequent and {{1}} to use.",
    blankOptionsByIndex: { "0": ["reliable", "rare"], "1": ["easy", "complex"] },
  },
  HIGHLIGHT_CORRECT_SUMMARY: {
    taskCode: "HIGHLIGHT_CORRECT_SUMMARY",
    prompt: "Select the sentence that best summarizes the recording.",
    options: [
      { id: "0", label: "The speaker explains how small habits can improve concentration." },
      { id: "1", label: "The speaker announces a new examination timetable." },
      { id: "2", label: "The speaker compares three kinds of transport." },
    ],
  },
  SELECT_MISSING_WORD: {
    taskCode: "SELECT_MISSING_WORD",
    prompt: "Listen and select the word that completes the sentence.",
    options: [
      { id: "0", label: "benefit" },
      { id: "1", label: "pattern" },
      { id: "2", label: "distance" },
    ],
  },
  HIGHLIGHT_INCORRECT_WORDS: {
    taskCode: "HIGHLIGHT_INCORRECT_WORDS",
    prompt: "Select the words that do not match the recording.",
    tokens: [
      { id: "0", text: "The" },
      { id: "1", text: "researchers" },
      { id: "2", text: "carefully" },
      { id: "3", text: "recorded" },
      { id: "4", text: "their" },
      { id: "5", text: "results" },
      { id: "6", text: "each" },
      { id: "7", text: "week." },
    ],
  },
  SUMMARIZE_WRITTEN_TEXT: {
    taskCode: "SUMMARIZE_WRITTEN_TEXT",
    prompt: "Write one sentence summarizing the passage.",
    text: "Urban gardens can make unused spaces productive while giving residents a place to grow food and meet neighbours.",
  },
  WRITE_ESSAY: {
    taskCode: "WRITE_ESSAY",
    prompt: "Some people prefer learning online, while others prefer learning in a classroom. Discuss both views and give your opinion.",
  },
  FILL_IN_THE_BLANKS_TYPE_IN: {
    taskCode: "FILL_IN_THE_BLANKS_TYPE_IN",
    prompt: "Listen to the recording and type the missing words.",
    text: "The speaker explains why {{0}} practice improves {{1}} memory.",
  },
  WRITE_FROM_DICTATION: {
    taskCode: "WRITE_FROM_DICTATION",
    prompt: "Listen and write the sentence you hear.",
  },
};

export function fixtureForTask(taskCode: string): PracticeTaskFixture {
  return fixtures[taskCode] ?? {
    taskCode,
    prompt: "Complete the task using the information shown on screen.",
  };
}

export function fixtureForRenderer(taskCode: string, rendererKey: string | null): PracticeTaskFixture {
  return fixtureForTask(taskCode || rendererKey || "PRACTICE");
}
