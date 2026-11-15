/** Which buttons the session footer shows, decided from where the learner is in the session. */
export interface FooterInput {
  /** Looking at an earlier question from the history. */
  viewingHistory: boolean;
  historyIndex: number | null;
  historyLength: number;
  /** The question on screen has been answered and scored (or is being scored). */
  isItemScored: boolean;
  /** The question just answered is showing its result. */
  answered: boolean;
  isScoring: boolean;
  submitting: boolean;
  /** The learner has typed or recorded something for the question on screen. */
  hasAnswer: boolean;
  sessionCompleted: boolean;
}

export interface FooterActions {
  showSubmit: boolean;
  showNext: boolean;
  showSkip: boolean;
  showPrev: boolean;
  prevDisabled: boolean;
  /**
   * A skipped question of a finished session: the server no longer takes answers, so it can be looked at but
   * not answered. While the session is running a skipped question can still be answered.
   */
  readOnly: boolean;
}

export function footerActions(input: FooterInput): FooterActions {
  const idle: FooterActions = {
    showSubmit: false, showNext: false, showSkip: false, showPrev: false, prevDisabled: false, readOnly: false,
  };
  const settled = !input.isScoring && !input.submitting;

  if (input.viewingHistory) {
    const base = { ...idle, showPrev: true, prevDisabled: input.historyIndex === 0 };
    if (input.isItemScored) return { ...base, showNext: settled };
    const readOnly = input.sessionCompleted;
    if (input.hasAnswer && !readOnly) return { ...base, showSubmit: true };
    return { ...base, showNext: true, readOnly };
  }
  const showPrev = input.historyLength > 0;
  if (input.answered) return { ...idle, showPrev, showNext: settled };
  return input.hasAnswer
    ? { ...idle, showPrev, showSubmit: true }
    : { ...idle, showPrev, showSkip: true };
}

export interface FooterDisabledInput {
  /** A command is running or the network is down. */
  locked: boolean;
  /** The question has no usable renderer or content, so it cannot be answered. */
  unsupported: boolean;
  audioUnavailable: boolean;
  recorderBusy: boolean;
  /** Extra locks decided by the session page. */
  prevDisabled?: boolean;
  submitDisabled?: boolean;
  nextDisabled?: boolean;
}

/**
 * Which footer buttons are locked. Only answering depends on the question being answerable: Next must stay usable on
 * an unsupported question, or a learner who steps back to one from the history could never move forward again.
 */
export function footerDisabled(input: FooterDisabledInput) {
  const busy = input.locked || input.recorderBusy;
  return {
    prev: busy || Boolean(input.prevDisabled),
    skip: busy,
    submit: busy || input.unsupported || input.audioUnavailable || Boolean(input.submitDisabled),
    next: busy || Boolean(input.nextDisabled),
  };
}
