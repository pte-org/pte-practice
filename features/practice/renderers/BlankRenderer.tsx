"use client";

import { useState } from "react";
import { setBlankWord } from "../answer-payloads";
import { parseBlankPrompt } from "../blank-prompt";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { TaskRendererProps } from "./RendererTypes";

export function BlankRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const { t } = useLocale();
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const isDropdown = fixture.taskCode === "FILL_IN_THE_BLANKS_DROPDOWN";
  const field = isDropdown ? "selections" : "placements";
  const chosen = typeof value[field] === "object" && value[field] !== null
    ? value[field] as Record<string, unknown> : {};
  const bank = fixture.blankOptions ?? [];
  const segments = parseBlankPrompt(fixture.text ?? fixture.prompt);

  function update(gap: number, word: string) {
    onChange(setBlankWord(value, field, gap, word));
  }

  function renderGap(gap: number) {
    const selected = typeof chosen[String(gap)] === "string" ? chosen[String(gap)] as string : "";
    const label = `${t("score.blankLabel")} ${gap + 1}`;
    if (isDropdown) {
      const choices = fixture.blankOptionsByIndex?.[String(gap)] ?? bank;
      return (
        <select className="task-inline-select" value={selected} disabled={disabled} aria-label={label}
          onChange={(event) => update(gap, event.target.value)}>
          <option value="">{t("score.chooseWord")}</option>
          {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
      );
    }
    return (
      <button className={`task-drop-slot${selected ? " task-drop-slot-filled" : ""}`} type="button"
        disabled={disabled} aria-label={label}
        onClick={() => update(gap, activeWord ?? "")}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); update(gap, event.dataTransfer.getData("text/plain")); }}>
        {selected || t("score.dropWord")}
      </button>
    );
  }

  return (
    <div className="task-blank-panel">
      <p className="task-blank-text">
        {segments.map((segment, index) => segment.kind === "text"
          ? <span key={index}>{segment.text}</span>
          : <span className="task-blank-gap" key={index}>{renderGap(segment.index)}</span>)}
      </p>
      {!isDropdown ? (
        <div className="task-word-bank" aria-label={t("score.wordBank")}>
          {bank.map((word) => (
            <button key={word} type="button" className={`task-word${activeWord === word ? " task-word-active" : ""}`}
              draggable={!disabled} disabled={disabled} onClick={() => setActiveWord(activeWord === word ? null : word)}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", word)}>{word}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
