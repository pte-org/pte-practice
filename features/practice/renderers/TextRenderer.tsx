"use client";

import type { TaskRendererProps } from "./RendererTypes";

export function TextRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const text = typeof value.text === "string" ? value.text : "";
  return (
    <div className="task-text-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <textarea className="task-answer-textarea" value={text} disabled={disabled}
        placeholder="Type your answer here" aria-label="Practice answer" onChange={(event) => onChange({ text: event.target.value })} />
      <span className="task-character-count">{text.length} characters</span>
    </div>
  );
}
