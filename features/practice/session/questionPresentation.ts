import type { PracticeTaskFixture } from "../fixtures";

/**
 * Listening and speaking tasks that test what the learner hears: showing the transcript before submitting would
 * turn Repeat Sentence into Read Aloud and Write From Dictation into copying. The transcript belongs in the
 * post-submission learning view.
 */
const AUDIO_ONLY_TASKS: ReadonlySet<string> = new Set([
  "ANSWER_SHORT_QUESTION",
  "REPEAT_SENTENCE",
  "RE_TELL_LECTURE",
  "WRITE_FROM_DICTATION",
  "SUMMARIZE_SPOKEN_TEXT",
  "SELECT_MISSING_WORD",
  "HIGHLIGHT_CORRECT_SUMMARY",
]);

export function hideQuestionTranscript(taskCode: string, submitted: boolean): boolean {
  return AUDIO_ONLY_TASKS.has(taskCode) && !submitted;
}

export function requiresQuestionAudio(taskCode: string, fixture: PracticeTaskFixture | null, submitted: boolean): boolean {
  return hideQuestionTranscript(taskCode, submitted) && !fixture?.audioUrl;
}

export function questionFixture(taskCode: string, fixture: PracticeTaskFixture, submitted: boolean): PracticeTaskFixture {
  return hideQuestionTranscript(taskCode, submitted) ? { ...fixture, prompt: "", text: undefined, audioExpected: true } : fixture;
}
