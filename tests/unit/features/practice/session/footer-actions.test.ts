import { describe, expect, it } from "vitest";
import { footerActions, type FooterInput } from "@/features/practice/session/footer-actions";

const base: FooterInput = {
  viewingHistory: false, historyIndex: null, historyLength: 0, isItemScored: false, answered: false,
  isScoring: false, submitting: false, hasAnswer: false, sessionCompleted: false,
};
const pick = (actions: ReturnType<typeof footerActions>) => ({
  submit: actions.showSubmit, next: actions.showNext, skip: actions.showSkip, prev: actions.showPrev,
});

describe("footer actions of the live question", () => {
  it("offers Skip until something is answered, then Submit", () => {
    expect(pick(footerActions(base))).toEqual({ submit: false, next: false, skip: true, prev: false });
    expect(pick(footerActions({ ...base, hasAnswer: true }))).toEqual({ submit: true, next: false, skip: false, prev: false });
  });

  it("shows Prev only when there is a history", () => {
    expect(footerActions({ ...base, historyLength: 2 }).showPrev).toBe(true);
    expect(footerActions({ ...base, historyLength: 0 }).showPrev).toBe(false);
  });

  it("shows only Next (and Prev) on a result, and not while it is being scored or submitted", () => {
    const result = { ...base, answered: true, historyLength: 1 };
    expect(pick(footerActions(result))).toEqual({ submit: false, next: true, skip: false, prev: true });
    expect(footerActions({ ...result, isScoring: true }).showNext).toBe(false);
    expect(footerActions({ ...result, submitting: true }).showNext).toBe(false);
  });
});

describe("footer actions while browsing the history", () => {
  const history = { ...base, viewingHistory: true, historyIndex: 1, historyLength: 3 };

  it("always allows Prev, except from the first question", () => {
    expect(footerActions(history).showPrev).toBe(true);
    expect(footerActions(history).prevDisabled).toBe(false);
    expect(footerActions({ ...history, historyIndex: 0 }).prevDisabled).toBe(true);
  });

  it("only moves on from a scored question, once scoring has settled", () => {
    const scored = { ...history, isItemScored: true, hasAnswer: true };
    expect(pick(footerActions(scored))).toEqual({ submit: false, next: true, skip: false, prev: true });
    expect(footerActions({ ...scored, isScoring: true }).showNext).toBe(false);
  });

  it("lets a skipped question of a running session be answered", () => {
    const skipped = { ...history, isItemScored: false };
    expect(pick(footerActions(skipped))).toEqual({ submit: false, next: true, skip: false, prev: true });
    const typed = footerActions({ ...skipped, hasAnswer: true });
    expect(pick(typed)).toEqual({ submit: true, next: false, skip: false, prev: true });
    expect(typed.readOnly).toBe(false);
  });

  it("makes a skipped question of a finished session read-only: no Submit, no Skip, only Prev and Next", () => {
    const finished = { ...history, isItemScored: false, sessionCompleted: true };
    for (const hasAnswer of [false, true]) {
      const actions = footerActions({ ...finished, hasAnswer });
      expect(pick(actions)).toEqual({ submit: false, next: true, skip: false, prev: true });
      expect(actions.readOnly).toBe(true);
    }
  });

  it("does not make an answered question read-only just because the session is finished", () => {
    const actions = footerActions({ ...history, isItemScored: true, sessionCompleted: true });
    expect(actions.readOnly).toBe(false);
    expect(actions.showNext).toBe(true);
  });
});
