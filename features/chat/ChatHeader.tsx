"use client";

import { useCallback, useRef, useState, type ReactElement } from "react";
import { AppIcon, Button } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { PipArtwork } from "@/features/mascot/PipArtwork";
import { AssistantNameEditor } from "./AssistantNameEditor";
import { useAssistantName } from "./useAssistantName";
import type { ChatDragHandlers } from "./useChatDrag";

interface ChatHeaderProps {
  drag: ChatDragHandlers;
  pending: boolean;
  onNewChat: () => void;
  onClose: () => void;
}

export function ChatHeader({ drag, pending, onNewChat, onClose }: ChatHeaderProps): ReactElement {
  const { t } = useTranslation();
  const name = useAssistantName() ?? t("chat.title");
  const [editing, setEditing] = useState(false);
  const renameRef = useRef<HTMLButtonElement>(null);
  const closeEditor = useCallback(() => { setEditing(false); renameRef.current?.focus(); }, []);
  const { onMoveKeyDown, ...dragHandlers } = drag;
  return <>
    <header className="chat-header" {...dragHandlers}>
      <span className="chat-avatar" aria-hidden="true"><PipArtwork /></span>
      <div className="chat-heading" tabIndex={0} role="group" aria-label={t("chat.moveHint")}
        title={t("chat.moveHint")} onKeyDown={onMoveKeyDown}>
        <h2 className="chat-title" title={name}>{name}</h2>
        <p className="chat-subtitle">{t("chat.subtitle")}</p>
      </div>
      <Button ref={renameRef} variant="secondary" appearance="ghost" size="sm" iconOnly className="chat-icon-button"
        onClick={() => setEditing((value) => !value)} aria-expanded={editing}
        aria-label={t("chat.renameAssistant")} title={t("chat.renameAssistant")}><AppIcon name="edit" size={18} /></Button>
      <Button variant="secondary" appearance="ghost" size="sm" iconOnly className="chat-icon-button"
        onClick={onNewChat} disabled={pending} aria-label={t("chat.newChat")} title={t("chat.newChat")}>
        <AppIcon name="newChat" size={18} />
      </Button>
      <Button variant="secondary" appearance="ghost" size="sm" iconOnly className="chat-icon-button"
        onClick={onClose} aria-label={t("chat.toggleClose")} title={t("chat.toggleClose")}><AppIcon name="close" size={18} /></Button>
    </header>
    {editing ? <div className="chat-name-settings" onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); closeEditor(); }
    }}><AssistantNameEditor onSaved={closeEditor} onCancel={closeEditor} /></div> : null}
  </>;
}
