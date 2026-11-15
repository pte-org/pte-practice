export interface FooterInput {
  /** The student went back with "Trước" and is looking at an earlier question. */
  viewingHistory: boolean;
  atFirstHistoryItem: boolean;
  historyLength: number;
  /** The earlier question being looked at has a result. */
  itemScored: boolean;
  isScoring: boolean;
  submitting: boolean;
  /** The question on screen has an answer the student can send. */
  hasAnswer: boolean;
}

export interface FooterButtons {
  showPrev: boolean;
  prevDisabled: boolean;
  showSkip: boolean;
  showSubmit: boolean;
  showNext: boolean;
  /** Sending the answer also moves on to the next question (the current question, as in the Pearson test). */
  submitAdvances: boolean;
}

/**
 * Which footer buttons a question shows. On the current question there is one action: "Bỏ qua" while it has no
 * answer, "Tiếp theo" (which saves it and moves on) once it has one. An earlier question keeps "Trước"/"Tiếp theo"
 * to move through history, and "Nộp câu trả lời" when it was skipped and has now been answered.
 */
export function footerButtons(input: FooterInput): FooterButtons {
  if (input.viewingHistory) {
    const answering = !input.itemScored && input.hasAnswer;
    return {
      showPrev: true,
      prevDisabled: input.atFirstHistoryItem,
      showSkip: false,
      showSubmit: answering,
      showNext: !answering && (!input.itemScored || (!input.isScoring && !input.submitting)),
      submitAdvances: false,
    };
  }
  return {
    showPrev: input.historyLength > 0,
    prevDisabled: false,
    showSkip: !input.hasAnswer,
    showSubmit: input.hasAnswer,
    showNext: false,
    submitAdvances: true,
  };
}
