export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

export type StepState = "done" | "current" | "upcoming";

/** Steps before the current one are done, the current one is current, the rest upcoming; an unknown id marks nothing. */
export function stepStates(steps: StepItem[], currentStep: string): StepState[] {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  return steps.map((_, index) => {
    if (currentIndex < 0) return "upcoming";
    if (index < currentIndex) return "done";
    return index === currentIndex ? "current" : "upcoming";
  });
}
