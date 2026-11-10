import { describe, expect, it } from "vitest";
import { hideQuestionTranscript, questionFixture, requiresQuestionAudio } from "@/features/practice/session/questionPresentation";
import type { PracticeTaskFixture } from "@/features/practice/fixtures";

const fixture: PracticeTaskFixture = {
  taskCode: "ANSWER_SHORT_QUESTION", prompt: "What is the term used for a professional who practices law?",
  text: "What is the term used for a professional who practices law?", audioUrl: "https://cdn.test/question.wav",
  imageUrl: "https://cdn.test/prompt.png",
};

describe("ASQ question presentation", () => {
  it("hides the transcript during delivery while preserving audio, optional image and original content", () => {
    expect(hideQuestionTranscript("ANSWER_SHORT_QUESTION", false)).toBe(true);
    const visible = questionFixture("ANSWER_SHORT_QUESTION", fixture, false);
    expect(visible.prompt).toBe("");
    expect(visible.text).toBeUndefined();
    expect(visible.audioUrl).toBe(fixture.audioUrl);
    expect(visible.imageUrl).toBe(fixture.imageUrl);
    expect(fixture.prompt).toContain("practices law");
  });

  it("allows the transcript after submission and keeps Read Aloud text unchanged", () => {
    expect(questionFixture("ANSWER_SHORT_QUESTION", fixture, true)).toBe(fixture);
    expect(questionFixture("READ_ALOUD", fixture, false)).toBe(fixture);
    expect(hideQuestionTranscript("READ_ALOUD", false)).toBe(false);
  });

  it("blocks unanswered ASQ without playable audio instead of falling back to the transcript", () => {
    const missingAudio = { ...fixture, audioUrl: null };
    expect(requiresQuestionAudio("ANSWER_SHORT_QUESTION", missingAudio, false)).toBe(true);
    expect(questionFixture("ANSWER_SHORT_QUESTION", missingAudio, false).audioExpected).toBe(true);
    expect(requiresQuestionAudio("ANSWER_SHORT_QUESTION", fixture, false)).toBe(false);
    expect(requiresQuestionAudio("ANSWER_SHORT_QUESTION", missingAudio, true)).toBe(false);
    expect(requiresQuestionAudio("READ_ALOUD", missingAudio, false)).toBe(false);
  });
});
