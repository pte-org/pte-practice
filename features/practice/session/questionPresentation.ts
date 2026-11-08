import type { PracticeTaskFixture } from "../fixtures";

/** ASQ tests listening; its transcript belongs in the post-submission learning view. */
export function hideQuestionTranscript(taskCode: string, submitted: boolean): boolean {
  return taskCode === "ANSWER_SHORT_QUESTION" && !submitted;
}

export function requiresQuestionAudio(taskCode: string, fixture: PracticeTaskFixture | null, submitted: boolean): boolean {
  return taskCode === "ANSWER_SHORT_QUESTION" && !submitted && !fixture?.audioUrl;
}

export function questionFixture(taskCode: string, fixture: PracticeTaskFixture, submitted: boolean): PracticeTaskFixture {
  return hideQuestionTranscript(taskCode, submitted) ? { ...fixture, prompt: "", text: undefined, audioExpected: true } : fixture;
}
