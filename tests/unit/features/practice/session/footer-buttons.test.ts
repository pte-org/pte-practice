import { describe, expect, it } from "vitest";
import { footerButtons, type FooterInput } from "@/features/practice/session/footer-buttons";

const current: FooterInput = {
  viewingHistory: false, atFirstHistoryItem: false, historyLength: 0, itemScored: false,
  isScoring: false, submitting: false, hasAnswer: false,
};

describe("footer buttons", () => {
  it("offers skip on an unanswered current question", () => {
    const buttons = footerButtons(current);
    expect(buttons.showSkip).toBe(true);
    expect(buttons.showSubmit).toBe(false);
  });

  it("offers one action that saves and moves on once the current question is answered", () => {
    const buttons = footerButtons({ ...current, hasAnswer: true, historyLength: 2 });
    expect(buttons).toMatchObject({ showSubmit: true, submitAdvances: true, showSkip: false, showNext: false,
      showPrev: true });
  });

  it("checks a choice answer first, so its action reads as a check and the next one moves on", () => {
    const checking = footerButtons({ ...current, hasAnswer: true, instantFeedback: true });
    expect(checking).toMatchObject({ showSubmit: true, submitAdvances: true, checksFirst: true });
    expect(footerButtons({ ...current, hasAnswer: true }).checksFirst).toBe(false);
    const afterCheck = footerButtons({ ...current, viewingHistory: true, itemScored: true, instantFeedback: true });
    expect(afterCheck).toMatchObject({ showNext: true, showSubmit: false, checksFirst: false });
  });

  it("moves through an answered earlier question, waiting while it is being scored", () => {
    const history = { ...current, viewingHistory: true, itemScored: true, atFirstHistoryItem: true };
    expect(footerButtons(history)).toMatchObject({ showNext: true, showSubmit: false, prevDisabled: true });
    expect(footerButtons({ ...history, isScoring: true }).showNext).toBe(false);
  });

  it("lets a skipped earlier question be answered in place without leaving it", () => {
    const skipped = { ...current, viewingHistory: true, hasAnswer: true };
    expect(footerButtons(skipped)).toMatchObject({ showSubmit: true, submitAdvances: false, showNext: false });
    expect(footerButtons({ ...skipped, hasAnswer: false })).toMatchObject({ showSubmit: false, showNext: true });
  });
});
