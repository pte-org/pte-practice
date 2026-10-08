"use client";

import { useState } from "react";
import type { TaskRendererProps } from "./RendererTypes";

export function BlankRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const options = fixture.blankOptions ?? [];
  const selections = typeof value.selections === "object" && value.selections !== null
    ? value.selections as Record<string, unknown>
    : {};
  const placements = typeof value.placements === "object" && value.placements !== null
    ? value.placements as Record<string, unknown>
    : {};
  const isDropdown = fixture.taskCode === "FILL_IN_THE_BLANKS_DROPDOWN";
  const blankCount = 2;

  function update(index: number, word: string) {
    const key = String(index);
    onChange(isDropdown
      ? { selections: { ...selections, [key]: word } }
      : { placements: { ...placements, [key]: word } });
  }

  return (
    <div className="task-blank-panel">
      <p className="task-blank-text">{fixture.text ?? fixture.prompt}</p>
      <div className="task-blank-slots">
        {Array.from({ length: blankCount }, (_, index) => {
          const key = String(index);
          const selected = (isDropdown ? selections[key] : placements[key]);
          return isDropdown ? (
            <label className="task-blank-field" key={key}>
              <span>Blank {index + 1}</span>
              <select value={typeof selected === "string" ? selected : ""} disabled={disabled}
                onChange={(event) => update(index, event.target.value)}>
                <option value="">Choose a word</option>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ) : (
            <button className={`task-drop-slot${selected ? " task-drop-slot-filled" : ""}`} key={key}
              type="button" disabled={disabled} aria-label={`Blank ${index + 1}`}
              onClick={() => activeWord && update(index, activeWord)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); update(index, event.dataTransfer.getData("text/plain")); }}>
              {typeof selected === "string" ? selected : `Drop word ${index + 1} here`}
            </button>
          );
        })}
      </div>
      {!isDropdown ? (
        <div className="task-word-bank" aria-label="Word bank">
          {options.map((option) => (
            <button key={option} type="button" className={`task-word${activeWord === option ? " task-word-active" : ""}`}
              draggable={!disabled} disabled={disabled} onClick={() => setActiveWord(option)}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", option)}>{option}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
