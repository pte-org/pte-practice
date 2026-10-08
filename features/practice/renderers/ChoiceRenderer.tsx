"use client";

import type { TaskRendererProps } from "./RendererTypes";

export function ChoiceRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const multiple = fixture.taskCode.includes("MULTIPLE");
  const selected = Array.isArray(value.selectedOptions)
    ? value.selectedOptions.filter((item): item is string => typeof item === "string")
    : typeof value.selectedOption === "string" ? [value.selectedOption] : [];

  function toggle(id: string) {
    if (multiple) {
      const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
      onChange({ selectedOptions: next });
      return;
    }
    onChange({ selectedOption: id });
  }

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
            onClick={() => toggle(option.id)}
          >
            <span className="task-choice-marker" aria-hidden="true">{checked ? "✓" : ""}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
