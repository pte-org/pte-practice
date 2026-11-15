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
