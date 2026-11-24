"use client";

import { useState } from "react";
import { setBlankWord } from "../answer-payloads";
import { parseBlankPrompt } from "../blank-prompt";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import { blankMarks } from "./blank-verdict";
import type { TaskRendererProps } from "./RendererTypes";
import "./choice-verdict.css";

const WORD_TYPE = "text/plain";
const GAP_TYPE = "application/x-blank-gap";

export function BlankRenderer({ fixture, value, disabled = false, onChange, verdicts = [] }: TaskRendererProps) {
  const { t } = useLocale();
  const marks = blankMarks(verdicts);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const isDropdown = fixture.taskCode === "FILL_IN_THE_BLANKS_DROPDOWN";
  const field = isDropdown ? "selections" : "placements";
  const chosen = typeof value[field] === "object" && value[field] !== null
    ? value[field] as Record<string, unknown> : {};
  const bank = fixture.blankOptions ?? [];
  const segments = parseBlankPrompt(fixture.text ?? fixture.prompt);

  const bankCounts = countWords(bank);
  const usedCounts = countWords(Object.values(chosen).filter((word): word is string => typeof word === "string" && word !== ""));

  function update(gap: number, word: string) {
    onChange(setBlankWord(value, field, gap, word));
  }

  /** A word can be placed only as many times as the bank lists it (a gap's own word does not count against it). */
  function place(gap: number, word: string) {
    const current = typeof chosen[String(gap)] === "string" ? chosen[String(gap)] as string : "";
    const used = (usedCounts.get(word) ?? 0) - (current === word ? 1 : 0);
    if (!bankCounts.has(word) || used >= (bankCounts.get(word) ?? 0)) return;
    update(gap, word);
    setActiveWord(null);
  }

  function onGapClick(gap: number, selected: string) {
    if (activeWord) place(gap, activeWord);
    else if (selected) update(gap, "");
  }

  /** Once the answer is scored, each gap says whether its word was right and, if not, which word belonged there. */
  function renderMark(gap: number) {
    const mark = marks.get(gap);
    if (!mark) return null;
    if (mark.state === "right") return <span className="task-blank-mark task-blank-mark-right">✓</span>;
    return (
      <span className="task-blank-mark task-blank-mark-wrong">
        ✕ {mark.correctWord ? <em>{mark.correctWord}</em> : null}
      </span>
    );
  }

  function renderGap(gap: number) {
    const selected = typeof chosen[String(gap)] === "string" ? chosen[String(gap)] as string : "";
    const label = `${t("score.blankLabel")} ${gap + 1}`;
    const marked = marks.get(gap);
    const markClass = marked ? ` task-blank-${marked.state}` : "";
    if (isDropdown) {
      const choices = fixture.blankOptionsByIndex?.[String(gap)] ?? bank;
      return (
        <>
          <select className={`task-inline-select${markClass}`} value={selected} disabled={disabled} aria-label={label}
            onChange={(event) => update(gap, event.target.value)}>
            <option value="">{t("score.chooseWord")}</option>
            {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>
          {renderMark(gap)}
        </>
      );
    }
    return (
      <>
      <button className={`task-drop-slot${selected ? " task-drop-slot-filled" : ""}${markClass}`} type="button"
        disabled={disabled} aria-label={label}
        draggable={!disabled && Boolean(selected)}
        onClick={() => onGapClick(gap, selected)}
        onDragStart={(event) => { event.dataTransfer.setData(GAP_TYPE, String(gap)); event.dataTransfer.setData(WORD_TYPE, selected); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const from = event.dataTransfer.getData(GAP_TYPE);
          const word = event.dataTransfer.getData(WORD_TYPE);
          // Dragging from another gap moves the word, so it is never counted twice.
          if (from !== "" && Number(from) !== gap) update(Number(from), "");
          place(gap, word);
        }}>
        {selected || t("score.dropWord")}
      </button>
      {renderMark(gap)}
      </>
    );
  }

  // Each bank entry is "used" while placements still account for its occurrence of that word.
  const seen = new Map<string, number>();
  const wordButtons = bank.map((word, index) => {
    const occurrence = seen.get(word) ?? 0;
    seen.set(word, occurrence + 1);
    const used = occurrence < (usedCounts.get(word) ?? 0);
    return (
      <button key={`${word}-${index}`} type="button"
        className={`task-word${activeWord === word ? " task-word-active" : ""}${used ? " task-word-used" : ""}`}
        draggable={!disabled && !used} disabled={disabled || used}
        onClick={() => setActiveWord(activeWord === word ? null : word)}
        onDragStart={(event) => event.dataTransfer.setData(WORD_TYPE, word)}>{word}</button>
    );
  });

  return (
    <div className="task-blank-panel">
      <p className="task-blank-text">
        {segments.map((segment, index) => segment.kind === "text"
          ? <span key={index}>{segment.text}</span>
          : <span className="task-blank-gap" key={index}>{renderGap(segment.index)}</span>)}
      </p>
      {!isDropdown ? (
        <div className="task-word-bank" aria-label={t("score.wordBank")}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = event.dataTransfer.getData(GAP_TYPE);
            if (from !== "" && !disabled) update(Number(from), "");
          }}>
          {wordButtons}
        </div>
      ) : null}
    </div>
  );
}

function countWords(words: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return counts;
}
