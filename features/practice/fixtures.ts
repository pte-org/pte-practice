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
  blankOptions?: string[];
}

const fixtures: Record<string, PracticeTaskFixture> = {
  PERSONAL_INTRODUCTION: {
    taskCode: "PERSONAL_INTRODUCTION",
    prompt: "Introduce yourself and talk about your interests or study plans.",
    instruction: "Speak clearly. Your response is not scored.",
  },
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
      { id: "a", label: "It explains a recent change." },
      { id: "b", label: "It compares two travel options." },
      { id: "c", label: "It describes a scientific process." },
      { id: "d", label: "It gives instructions for a new service." },
    ],
  },
  MC_READING_MULTIPLE: {
    taskCode: "MC_READING_MULTIPLE",
    prompt: "Which statements are supported by the passage?",
    instruction: "Select all correct responses.",
    options: [
      { id: "a", label: "The project began as a local experiment." },
      { id: "b", label: "The team measured results over time." },
      { id: "c", label: "The project was cancelled immediately." },
      { id: "d", label: "The findings changed the final plan." },
    ],
  },
  RE_ORDER_PARAGRAPHS: {
    taskCode: "RE_ORDER_PARAGRAPHS",
    prompt: "Re-order the paragraphs to create a logical passage.",
    paragraphs: [
      { id: "p1", text: "As a result, the library extended its opening hours." },
      { id: "p2", text: "The community survey showed that many readers worked late." },
      { id: "p3", text: "The library then reviewed its schedule and staffing." },
      { id: "p4", text: "The change made evening visits much more convenient." },
    ],
  },
  FILL_IN_THE_BLANKS_DRAG_AND_DROP: {
    taskCode: "FILL_IN_THE_BLANKS_DRAG_AND_DROP",
    prompt: "Complete the text by placing each word in the correct blank.",
    text: "Good planning can ___ uncertainty and make a project more ___.",
    blankOptions: ["reduce", "efficient", "increase", "difficult"],
  },
  FILL_IN_THE_BLANKS_DROPDOWN: {
    taskCode: "FILL_IN_THE_BLANKS_DROPDOWN",
    prompt: "Choose the best word for each blank.",
    text: "Public transport is ___ when services are frequent and ___ to use.",
    blankOptions: ["reliable", "easy", "rare", "complex"],
  },
  HIGHLIGHT_CORRECT_SUMMARY: {
    taskCode: "HIGHLIGHT_CORRECT_SUMMARY",
    prompt: "Select the sentence that best summarizes the recording.",
    options: [
      { id: "a", label: "The speaker explains how small habits can improve concentration." },
      { id: "b", label: "The speaker announces a new examination timetable." },
      { id: "c", label: "The speaker compares three kinds of transport." },
    ],
  },
  SELECT_MISSING_WORD: {
    taskCode: "SELECT_MISSING_WORD",
    prompt: "Listen and select the word that completes the sentence.",
    options: [
      { id: "a", label: "benefit" },
      { id: "b", label: "pattern" },
      { id: "c", label: "distance" },
    ],
  },
  HIGHLIGHT_INCORRECT_WORDS: {
    taskCode: "HIGHLIGHT_INCORRECT_WORDS",
    prompt: "Select the words that do not match the recording.",
    tokens: [
      { id: "t1", text: "The" },
      { id: "t2", text: "researchers" },
      { id: "t3", text: "carefully" },
      { id: "t4", text: "recorded" },
      { id: "t5", text: "their" },
      { id: "t6", text: "results" },
      { id: "t7", text: "each" },
      { id: "t8", text: "week." },
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
    text: "The speaker explains why regular practice improves long-term memory.",
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
