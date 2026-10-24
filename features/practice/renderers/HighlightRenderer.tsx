"use client";

import { toggleWordIndex, wordIndexes } from "../answer-payloads";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import { ChoiceRenderer } from "./ChoiceRenderer";
import type { TaskRendererProps } from "./RendererTypes";

export function HighlightRenderer(props: TaskRendererProps) {
  const { fixture, value, disabled = false, onChange } = props;
  const { t } = useLocale();
  if (fixture.taskCode === "HIGHLIGHT_CORRECT_SUMMARY") return <ChoiceRenderer {...props} />;

  const selected = wordIndexes(value);
  return (
    <p className="task-highlight-text" aria-label={t("score.transcriptWords")}>
      {(fixture.tokens ?? []).map((token) => {
        const index = Number.parseInt(token.id, 10);
        const active = selected.includes(index);
        return (
          <button type="button" key={token.id} className={active ? "task-token-selected" : ""}
            disabled={disabled} aria-pressed={active}
            onClick={() => onChange(toggleWordIndex(value, index))}>{token.text}</button>
        );
      })}
    </p>
  );
}
