"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from "react";
import { Button } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { normalizeAssistantName, resetAssistantName, saveAssistantName } from "./assistant-name";
import { ASSISTANT_NAME_MAX_LENGTH } from "./constants";
import { useAssistantName } from "./useAssistantName";
import { formatChatText } from "./chat-format";
import "./assistant-name.css";

interface AssistantNameEditorProps {
  onSaved?: () => void;
  onCancel?: () => void;
}

export function AssistantNameEditor({ onSaved, onCancel }: AssistantNameEditorProps): ReactElement {
  const { t } = useTranslation();
  const customName = useAssistantName();
  const [draft, setDraft] = useState(customName ?? "");
  const [failed, setFailed] = useState(false);
  const inputId = useId();
  const noticeId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = normalizeAssistantName(draft);
  useEffect(() => { if (onCancel) inputRef.current?.focus(); }, [onCancel]);
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!normalized) return;
    if (!saveAssistantName(normalized)) { setFailed(true); return; }
    setFailed(false);
    onSaved?.();
  };
  const reset = () => {
    if (!resetAssistantName()) { setFailed(true); return; }
    setDraft("");
    setFailed(false);
    onSaved?.();
  };
  return (
    <form className="assistant-name-editor" onSubmit={save}>
      <label htmlFor={inputId}>{t("chat.assistantName")}</label>
      <input ref={inputRef} id={inputId} value={draft} placeholder={t("chat.title")} maxLength={ASSISTANT_NAME_MAX_LENGTH * 2}
        aria-describedby={failed ? `${noticeId} ${errorId}` : noticeId} autoComplete="off"
        onChange={(event) => { setDraft(event.target.value); setFailed(false); }} />
      <p id={noticeId}>{formatChatText(t("chat.nameLocalNotice"), { limit: ASSISTANT_NAME_MAX_LENGTH })}</p>
      {failed ? <p id={errorId} className="assistant-name-error" role="alert">{t("chat.nameSaveError")}</p> : null}
      <div className="assistant-name-actions">
        <Button type="submit" size="sm" disabled={!normalized}>{t("chat.saveName")}</Button>
        <Button variant="secondary" size="sm" onClick={reset}>{t("chat.resetName")}</Button>
        {onCancel ? <Button variant="secondary" appearance="ghost" size="sm" onClick={onCancel}>{t("session.cancel")}</Button> : null}
      </div>
    </form>
  );
}
