"use client";

import { parseBlankPrompt } from "../blank-prompt";
import { setTypeInBlank, TYPE_IN_MAX_LENGTH, typeInBlankValues } from "../answer-payloads";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { TaskRendererProps } from "./RendererTypes";

/** Listening type-in: one input per {{n}} gap, answered positionally (no commas in the payload). */
export function TypeInRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const { t } = useLocale();
  const source = fixture.text ?? fixture.prompt;
  const segments = parseBlankPrompt(source);
  const gaps = segments.filter((segment) => segment.kind === "gap");
  // A passage without markers still needs one input so the learner can answer.
  const count = Math.max(1, gaps.length);
  const values = typeInBlankValues(value, count);
  let position = 0;

  const input = (slot: number, key: string | number) => (
    <input className="task-inline-input" key={key} type="text" value={values[slot] ?? ""} disabled={disabled}
      maxLength={TYPE_IN_MAX_LENGTH} autoComplete="off" spellCheck={false}
      aria-label={`${t("score.blankLabel")} ${slot + 1}`} placeholder={t("score.typeInPlaceholder")}
      onChange={(event) => onChange(setTypeInBlank(value, slot, event.target.value, count))} />
  );

  return (
    <p className="task-blank-text">
      {segments.map((segment, index) => segment.kind === "text"
        ? <span key={index}>{segment.text}</span>
        : input(position++, index))}
      {gaps.length === 0 ? input(0, "single") : null}
    </p>
  );
}
