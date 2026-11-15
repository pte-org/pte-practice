import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { en } from "@/common/i18n/en";
import type { PracticeItemResult } from "@/features/practice/contracts";
import { AnswerFeedback } from "@/features/practice/feedback/AnswerFeedback";
import { ScoringRequest } from "@/features/practice/feedback/ScoringRequest";

const scored: PracticeItemResult = {
  itemPublicId: "item-1", taskCode: "READ_ALOUD", state: "SCORED", score: 74, scoreStatus: "UNVALIDATED",
  subScores: { CONTENT: 9, PRONUNCIATION: 4 }, subScoreMax: { CONTENT: 12, PRONUNCIATION: 5 },
  feedback: "Khá tốt.", transcript: "Solar power", failureCode: null, retryable: false, scoredAt: null,
  feedbackDetail: {
    traitReasons: { PRONUNCIATION: "Phát âm rõ." },
    tips: ["Đọc theo cụm từ."],
    wordMarks: [{ word: "annual", mark: "OMITTED" }, { word: "very", mark: "INSERTED" }],
  },
};

const render = (node: React.ReactNode): string => renderToStaticMarkup(<LocaleProvider>{node}</LocaleProvider>);

describe("AnswerFeedback", () => {
  it("shows each trait's reason with its band, the word check and the tips", () => {
    const html = render(<AnswerFeedback result={scored} />);
    expect(html).toContain("Phát âm rõ.");
    expect(html).toContain("4 / 5");
    expect(html).toContain(en.score.omittedWords);
    expect(html).toContain("answer-feedback-word-omitted\">annual");
    expect(html).toContain("answer-feedback-word-inserted\">very");
    expect(html).toContain("Đọc theo cụm từ.");
  });

  it("renders nothing for a result scored before feedback existed", () => {
    expect(render(<AnswerFeedback result={{ ...scored, feedbackDetail: undefined }} />)).toBe("");
  });
});

describe("ScoringRequest", () => {
  it("offers the Score button in a task session", () => {
    const html = render(<ScoringRequest canRequest requesting={false} error={null} onRequest={() => undefined} />);
    expect(html).toContain(en.score.requestScoring);
    expect(html).toContain(en.score.requestHint);
  });

  it("explains that a mock test is scored after it is submitted", () => {
    const html = render(<ScoringRequest canRequest={false} requesting={false} error={null} onRequest={() => undefined} />);
    expect(html).toContain(en.score.mockScoredLater);
    expect(html).not.toContain("<button");
  });

  it("shows the sending state and a safe error message", () => {
    const html = render(<ScoringRequest canRequest requesting error="boom" onRequest={() => undefined} />);
    expect(html).toContain(en.score.requesting);
    expect(html).toContain(en.score.requestError);
    expect(html).not.toContain("boom");
  });
});
