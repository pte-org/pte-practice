import type { PracticeItemTiming } from "./session-contracts";

/**
 * Returns the canonical Pearson PTE instruction for a task code and its timing configuration,
 * matching the canonical instructions used in pte-app.
 */
export function getCanonicalTaskInstruction(
  taskCode: string | null | undefined,
  timing?: PracticeItemTiming | null,
): string | null {
  if (!taskCode) return null;
  const code = taskCode.toUpperCase();
  const prepSeconds = timing?.preRecordSeconds ?? 25;
  const responseSeconds = timing?.responseSeconds ?? 40;

  switch (code) {
    case "READ_ALOUD":
      return `Look at the text below. In ${responseSeconds} seconds, you must read this text aloud as naturally and clearly as possible. You have ${responseSeconds} seconds to read aloud.`;
    case "REPEAT_SENTENCE":
      return "You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.";
    case "DESCRIBE_IMAGE":
      return `Look at the image below. In ${prepSeconds} seconds, please speak into the microphone and describe in detail what the image is showing. You have ${responseSeconds} seconds to give your response.`;
    case "RE_TELL_LECTURE":
      return `You will hear a lecture. After listening to the lecture, in ${prepSeconds > 0 ? prepSeconds : 10} seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words. You have ${responseSeconds} seconds to give your response.`;
    case "ANSWER_SHORT_QUESTION":
      return "You will hear a question. Please give a simple and short answer. Often just one or a few words is enough.";
    case "RESPOND_TO_A_SITUATION":
      return "Listen to and read a situation, then provide a spoken response.";
    case "SUMMARIZE_GROUP_DISCUSSION":
      return "You will hear three people having a discussion. After listening to the discussion, summarize what you have heard.";
    case "PERSONAL_INTRODUCTION":
      return `Read the prompt below. In ${prepSeconds} seconds, you must record your introduction. You have ${responseSeconds} seconds to complete your response.`;
    case "SUMMARIZE_WRITTEN_TEXT":
      return "Read the passage below and summarize it using one sentence. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.";
    case "WRITE_ESSAY":
      return "You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English. You should write 200-300 words.";
    case "MC_READING_SINGLE":
      return "Read the text and choose the best answer.";
    case "MC_READING_MULTIPLE":
      return "Read the text and answer the multiple-choice question by selecting all correct responses. More than one response is correct.";
    case "RE_ORDER_PARAGRAPHS":
      return "The text boxes in the left panel have been arranged in random order. Restore the original order by dragging text boxes from the left panel to the right panel.";
    case "FILL_IN_THE_BLANKS_DRAG_AND_DROP":
    case "FILL_BLANKS_READING":
      return "In the text below some words are missing. Drag words from the box below to the appropriate place in the text.";
    case "FILL_IN_THE_BLANKS_DROPDOWN":
    case "FILL_BLANKS_READING_WRITING":
      return "Below is a text with blanks. Select the appropriate answer choice for each blank.";
    case "SUMMARIZE_SPOKEN_TEXT":
      return "You will hear a short lecture. Write a summary for a fellow student who was not present at the lecture. You should write 50-70 words. You have 10 minutes to finish this task.";
    case "MC_LISTENING_SINGLE":
      return "Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.";
    case "MC_LISTENING_MULTIPLE":
      return "Listen to the recording and answer the question by selecting all the correct responses. You will need to select more than one response.";
    case "FILL_IN_THE_BLANKS_TYPE_IN":
    case "FILL_BLANKS_LISTENING":
      return "You will hear a recording. Type the missing words in each blank.";
    case "HIGHLIGHT_CORRECT_SUMMARY":
      return "You will hear a recording. Click on the paragraph that best relates to the recording.";
    case "SELECT_MISSING_WORD":
      return "You will hear a recording about an academic topic. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.";
    case "HIGHLIGHT_INCORRECT_WORDS":
      return "You will hear a recording. Below is a transcription of the recording. Some words in the transcription differ from what the speaker said. Click on the words that are different.";
    case "WRITE_FROM_DICTATION":
      return "You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.";
    default:
      return null;
  }
}
