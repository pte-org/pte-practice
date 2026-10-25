"use client";

import { useRef } from "react";
import { AppIcon } from "@/common/components";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { TaskRendererProps } from "./RendererTypes";
import { wordCountIssue } from "../answer-checks";
import { countPracticeWords, normalizePracticeText } from "../media/text-utils";

/** Written answer: Copy / Cut / Paste toolbar as in the exam, the editor, and a word count against the task's range. */
export function TextRenderer({ fixture, value, disabled = false, onChange }: TaskRendererProps) {
  const { t } = useLocale();
  const editor = useRef<HTMLTextAreaElement>(null);
  const text = typeof value.text === "string" ? value.text : "";
  const words = countPracticeWords(text);
  const min = fixture.minWords ?? null;
  const max = fixture.maxWords ?? null;
  const issue = text.trim() ? wordCountIssue(words, min, max) : null;

  const selection = () => {
    const area = editor.current;
    return area ? { area, start: area.selectionStart, end: area.selectionEnd } : null;
  };
  const replaceSelection = (insert: string) => {
    const current = selection();
    if (!current) return;
    const next = text.slice(0, current.start) + insert + text.slice(current.end);
    onChange({ text: normalizePracticeText(next) });
  };
  const copy = async (cut: boolean) => {
    const current = selection();
    if (!current || current.start === current.end) return;
    try {
      await navigator.clipboard.writeText(text.slice(current.start, current.end));
      if (cut) replaceSelection("");
    } catch {
      // Clipboard blocked by the browser: the keyboard shortcuts still work.
    }
  };
  const paste = async () => {
    try {
      replaceSelection(await navigator.clipboard.readText());
    } catch {
      // Clipboard blocked by the browser: the keyboard shortcuts still work.
    }
  };

  return (
    <div className="task-text-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <div className="editor-frame">
        <div className="editor-toolbar" role="toolbar" aria-label={t("score.yourAnswer")}>
          <button type="button" disabled={disabled} onClick={() => void copy(false)}><AppIcon name="responses" size={16} /> {t("session.copy")}</button>
          <button type="button" disabled={disabled} onClick={() => void copy(true)}><AppIcon name="close" size={16} /> {t("session.cut")}</button>
          <button type="button" disabled={disabled} onClick={() => void paste()}><AppIcon name="practice" size={16} /> {t("session.paste")}</button>
        </div>
        <textarea ref={editor} className="task-answer-textarea" value={text} disabled={disabled}
          placeholder={t("score.answerPlaceholder")} aria-label={t("score.yourAnswer")}
          onChange={(event) => onChange({ text: normalizePracticeText(event.target.value) })} />
      </div>
      <span className={`task-character-count${issue ? " task-count-warning" : ""}`}>
        {min !== null || max !== null
          ? t("session.wordGuide").replace("{min}", String(min ?? 0)).replace("{max}", String(max ?? "∞"))
          : null}
        {" · "}{words} {t("score.wordCount")}
      </span>
    </div>
  );
}
