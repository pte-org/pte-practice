"use client";

import { selectedChoiceIds, toggleChoice } from "../answer-payloads";
import { ChoiceOptionList } from "./ChoiceOptionList";
import type { TaskRendererProps } from "./RendererTypes";

export function ChoiceRenderer({ fixture, value, disabled = false, onChange, verdicts }: TaskRendererProps) {
  const multiple = fixture.taskCode.includes("MULTIPLE");
  return (
    <ChoiceOptionList
      options={fixture.options ?? []}
      selected={selectedChoiceIds(value)}
      multiple={multiple}
      disabled={disabled}
      verdicts={verdicts}
      onToggle={(optionId) => onChange(toggleChoice(value, optionId, multiple))}
    />
  );
}
