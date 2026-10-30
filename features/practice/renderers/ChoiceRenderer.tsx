"use client";

import { selectedChoiceIds, toggleChoice } from "../answer-payloads";
import type { TaskRendererProps } from "./RendererTypes";

export function ChoiceRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const multiple = fixture.taskCode.includes("MULTIPLE");
  const selected = selectedChoiceIds(value);

  return (
    <div className="task-choice-list" role={multiple ? "group" : "radiogroup"}>
      {(fixture.options ?? []).map((option) => {
        const checked = selected.includes(option.id);
        return (
          <button
            className={`task-choice${checked ? " task-choice-selected" : ""}`}
            key={option.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(toggleChoice(value, option.id, multiple))}
          >
            <span className="task-choice-marker" aria-hidden="true">{checked ? "✓" : ""}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
