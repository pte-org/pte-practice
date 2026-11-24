import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/common/i18n";
import { en } from "@/common/i18n/en";
import { createPracticeApiClient } from "@/features/practice/api";
import { normalizeReview } from "@/features/practice/review-contracts";
import { ReviewQuestion } from "@/features/practice/review/ReviewQuestion";

const scored = (taskCode: string, extra: Record<string, unknown> = {}) => ({
  itemPublicId: "item-1", taskCode, state: "SCORED", score: 50, scoreStatus: null, subScores: {}, feedback: null,
  transcript: null, failureCode: null, retryable: false, scoredAt: null, ...extra,
});

const render = (taskCode: string, result: unknown): string => {
  const [item] = normalizeReview({
    items: [{ publicId: "item-1", taskCode, rendererKey: `${taskCode}_V1`, status: "ANSWERED", orderIndex: 1, objectiveScore: 50, result,
      savedPayload: "{\"selectedOptions\":[\"0\",\"1\"]}",
      options: [{ text: "one", orderIndex: 0 }, { text: "two", orderIndex: 1 }, { text: "three", orderIndex: 2 }] }],
  }, "session-1").items;
  return renderToStaticMarkup(
    <LocaleProvider>
      <ReviewQuestion item={item} sessionId="session-1" api={createPracticeApiClient()} canRequestScoring
        onResultChange={() => undefined} />
    </LocaleProvider>,
  );
};

describe("ReviewQuestion result panel", () => {
  it("shows a fixed-key answer as a plain result: no AI label, no criteria, figures of the picks", () => {
    const html = render("MC_READING_MULTIPLE", scored("MC_READING_MULTIPLE", {
      optionVerdicts: [{ orderIndex: 0, selected: true, correct: true }, { orderIndex: 1, selected: true, correct: false },
        { orderIndex: 2, selected: false, correct: true }],
    }));
    expect(html).toContain(en.review.resultPanelObjective);
    expect(html).not.toContain(en.review.resultPanelTitle);
    expect(html).not.toContain(`>${en.review.criteria}<`);
    expect(html).toContain("objective-result");
    expect(html).toContain(en.review.statRight);
    expect(html).toContain(en.review.statMissed);
    expect(html).toContain(en.review.correctAnswers);
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>three</li>");
    expect(html).not.toContain("<li>two</li>");
    expect(html).toContain("review-panels-objective");
    expect(html).toContain("review-panel-result-objective");
  });

  it("shows only the score and bar for a fixed-key answer without options", () => {
    const html = render("RE_ORDER_PARAGRAPHS", scored("RE_ORDER_PARAGRAPHS"));
    expect(html).toContain("objective-result");
    expect(html).not.toContain(en.review.statRight);
    expect(html).not.toContain(en.review.correctAnswers);
  });

  it("keeps the AI panel and the criteria for an AI-scored answer", () => {
    const html = render("READ_ALOUD", scored("READ_ALOUD"));
    expect(html).toContain(en.review.resultPanelTitle);
    expect(html).toContain(en.review.criteria);
    expect(html).not.toContain("objective-result");
  });
});
