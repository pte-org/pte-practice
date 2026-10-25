import type { ReactElement } from "react";
import { AppIcon } from "./AppIcon";
import { stepStates, type StepItem } from "./stepper-state";

export type { StepItem } from "./stepper-state";

/** Props mirror `Stepper` in `@pte/ui` (`steps`, `currentStep`) so a later move to the shared package is an import swap. */
export interface StepperProps {
  steps: StepItem[];
  currentStep: string;
  /** Accessible name of the whole list, already translated. */
  label?: string;
}

/** Ordered progress through named phases; the current step is marked in text and with aria-current, not colour alone. */
export function Stepper({ steps, currentStep, label }: StepperProps): ReactElement {
  const states = stepStates(steps, currentStep);
  return (
    <ol className="stepper" aria-label={label}>
      {steps.map((step, index) => (
        <li key={step.id} className={`stepper-step stepper-step-${states[index]}`}
          aria-current={states[index] === "current" ? "step" : undefined}>
          <span className="stepper-marker" aria-hidden="true">
            {states[index] === "done" ? <AppIcon name="check" size={14} /> : index + 1}
          </span>
          <span className="stepper-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
