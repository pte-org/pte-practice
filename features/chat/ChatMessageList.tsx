"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/common/i18n";
import { ChatMarkdown } from "./ChatMarkdown";
import type { ChatMessageView } from "./chat-state";

interface ChatMessageListProps {
  messages: ChatMessageView[];
  pendingQuestion: string | null;
}

export function ChatMessageList({ messages, pendingQuestion }: ChatMessageListProps) {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pendingQuestion]);

  if (messages.length === 0 && pendingQuestion === null) {
    return (
      <div className="chat-messages" role="log" aria-live="polite">
        <p className="chat-empty">{t("chat.emptyState")}</p>
      </div>
    );
  }

  return (
    <div className="chat-messages" role="log" aria-live="polite">
      {messages.map((message) => (message.role === "user"
        ? <div key={message.id} className="chat-bubble chat-bubble-user">{message.text}</div>
        : (
          <div key={message.id} className={`chat-bubble chat-bubble-assistant${message.refused ? " chat-bubble-refused" : ""}`}>
            {message.refused ? <span className="chat-refused-label">{t("chat.refusedLabel")}</span> : null}
            {message.refused ? <p>{message.text}</p> : <ChatMarkdown markdown={message.text} />}
          </div>
        )))}
      {pendingQuestion !== null ? (
        <>
          <div className="chat-bubble chat-bubble-user">{pendingQuestion}</div>
          <div className="chat-typing" role="status" aria-label={t("chat.thinking")}>
            <span className="chat-typing-dot" />
            <span className="chat-typing-dot" />
            <span className="chat-typing-dot" />
          </div>
        </>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
