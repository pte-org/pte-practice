"use client";

import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { TaskRendererProps } from "./RendererTypes";
import { countPracticeWords, normalizePracticeText } from "../media/text-utils";

export function TextRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const { t } = useLocale();
  const text = typeof value.text === "string" ? value.text : "";
  const words = countPracticeWords(text);
  const limits = fixture.minWords != null || fixture.maxWords != null
    ? ` (${fixture.minWords ?? 0}–${fixture.maxWords ?? "∞"})` : "";
  const overLimit = fixture.maxWords != null && words > fixture.maxWords;
  return (
    <div className="task-text-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <textarea className="task-answer-textarea" value={text} disabled={disabled}
        placeholder={t("score.answerPlaceholder")} aria-label={t("score.yourAnswer")}
        onChange={(event) => onChange({ text: normalizePracticeText(event.target.value) })} />
      <span className={`task-character-count${overLimit ? " task-count-warning" : ""}`}>
        {words} {t("score.wordCount")}{limits} · {text.length} characters
      </span>
    </div>
  );
}
