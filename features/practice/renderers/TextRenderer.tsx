"use client";

import type { TaskRendererProps } from "./RendererTypes";
import { countPracticeWords, normalizePracticeText } from "../media/text-utils";

export function TextRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const text = typeof value.text === "string" ? value.text : "";
  return (
    <div className="task-text-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <textarea className="task-answer-textarea" value={text} disabled={disabled}
        placeholder="Type your answer here" aria-label="Practice answer"
        onChange={(event) => onChange({ text: normalizePracticeText(event.target.value) })} />
      <span className="task-character-count">{countPracticeWords(text)} words · {text.length} characters</span>
    </div>
  );
}
