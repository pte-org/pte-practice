"use client";

import type { TaskRendererProps } from "./RendererTypes";

export function HighlightRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const isSummary = fixture.taskCode === "HIGHLIGHT_CORRECT_SUMMARY";
  const selected = Array.isArray(value.selectedOptionIds)
    ? value.selectedOptionIds.filter((item): item is string => typeof item === "string")
    : Array.isArray(value.selectedTextIds)
      ? value.selectedTextIds.filter((item): item is string => typeof item === "string")
      : [];

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    onChange(isSummary ? { selectedOptionIds: next } : { selectedTextIds: next });
  }

  if (isSummary) {
    return (
      <div className="task-choice-list" role="radiogroup">
        {(fixture.options ?? []).map((option) => (
          <button className={`task-choice${selected.includes(option.id) ? " task-choice-selected" : ""}`} key={option.id}
            type="button" role="radio" aria-checked={selected.includes(option.id)} disabled={disabled}
            onClick={() => onChange({ selectedOptionIds: [option.id] })}>
            <span className="task-choice-marker" aria-hidden="true">{selected.includes(option.id) ? "✓" : ""}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <p className="task-highlight-text" aria-label="Transcript words">
      {(fixture.tokens ?? []).map((token) => (
        <button type="button" key={token.id} className={selected.includes(token.id) ? "task-token-selected" : ""}
          disabled={disabled} aria-pressed={selected.includes(token.id)} onClick={() => toggle(token.id)}>{token.text}</button>
      ))}
    </p>
  );
}
