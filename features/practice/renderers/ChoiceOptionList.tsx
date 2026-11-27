"use client";

import { useTranslation } from "@/common/i18n";
import type { PracticeOptionVerdict } from "../result-contracts";
import { choiceMark, choiceOutcome, OUTCOME_TEXT, type ChoiceMark } from "./choice-verdict";
import "./choice-verdict.css";

export interface ChoiceOption {
  id: string;
  label: string;
}

interface ChoiceOptionListProps {
  options: readonly ChoiceOption[];
  selected: readonly string[];
  multiple: boolean;
  disabled?: boolean;
  /** Right and wrong per option of a scored answer; without them only the picked state shows. */
  verdicts?: readonly PracticeOptionVerdict[];
  onToggle?: (optionId: string) => void;
}

const MARK_TEXT = {
  right: "session.correct", wrong: "session.incorrect", missed: "session.rightAnswer",
} as const satisfies Record<Exclude<ChoiceMark, "none">, string>;

const MARK_SYMBOL: Record<ChoiceMark, string> = { right: "✓", wrong: "✕", missed: "✓", none: "" };

/** The options of a choice question: pickable while it is answered, marked right or wrong once it is scored. */
export function ChoiceOptionList({
  options, selected, multiple, disabled = false, verdicts = [], onToggle,
}: ChoiceOptionListProps) {
  const { t } = useTranslation();
  const outcome = choiceOutcome(verdicts);

  return (
    <div className="task-choice-list" role={multiple ? "group" : "radiogroup"}>
      {outcome ? (
        <p className={`task-choice-outcome task-choice-outcome-${outcome}`} role="status">{t(OUTCOME_TEXT[outcome])}</p>
      ) : null}
      {options.map((option) => {
        const checked = selected.includes(option.id);
        const mark = choiceMark(option.id, verdicts);
        const look = mark !== "none" ? ` task-choice-${mark}` : checked ? " task-choice-selected" : "";
        return (
          <button
            className={`task-choice${look}`}
            key={option.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onToggle?.(option.id)}
          >
            <span className="task-choice-marker" aria-hidden="true">
              {mark !== "none" ? MARK_SYMBOL[mark] : checked ? "✓" : ""}
            </span>
            <span>{option.label}</span>
            {mark !== "none" ? <span className="task-choice-verdict">{t(MARK_TEXT[mark])}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
