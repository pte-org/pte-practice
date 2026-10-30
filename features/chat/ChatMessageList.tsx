"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { ChatCopyButton } from "./ChatCopyButton";
import { ChatMarkdown } from "./ChatMarkdown";
import { ChatSuggestions } from "./ChatSuggestions";
import { scrollTargetFor } from "./chat-scroll";
import type { ChatMessageView } from "./chat-state";

interface ChatMessageListProps {
  messages: ChatMessageView[];
  pendingQuestion: string | null;
  /** False while the composer is locked: a chip would only fill an input the student cannot use. */
  suggestionsEnabled: boolean;
  onPickSuggestion: (text: string) => void;
}

export function ChatMessageList({ messages, pendingQuestion, suggestionsEnabled, onPickSuggestion }: ChatMessageListProps) {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);
  const lastAnswerRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(0);

  useEffect(() => {
    const target = scrollTargetFor({ previousCount: previousCount.current, messages, pendingQuestion });
    previousCount.current = messages.length;
    if (target === "end") endRef.current?.scrollIntoView({ block: "end" });
    if (target === "start-of-last-answer") lastAnswerRef.current?.scrollIntoView({ block: "start" });
  }, [messages, pendingQuestion]);

  if (messages.length === 0 && pendingQuestion === null) {
    return (
      <div className="chat-messages" role="log" aria-live="polite">
        <div className="chat-empty-block">
          <p className="chat-empty">{t("chat.emptyState")}</p>
          {suggestionsEnabled ? <ChatSuggestions onPick={onPickSuggestion} /> : null}
        </div>
      </div>
    );
  }

  const lastIndex = messages.length - 1;
  return (
    <div className="chat-messages" role="log" aria-live="polite">
      {messages.map((message, index) => (message.role === "user"
        ? <div key={message.id} className="chat-bubble chat-bubble-user">{message.text}</div>
        : (
          <div
            key={message.id}
            ref={index === lastIndex ? lastAnswerRef : undefined}
            className={`chat-bubble chat-bubble-assistant${message.refused ? " chat-bubble-refused" : ""}`}
          >
            {message.refused ? (
              <span className="chat-refused-label">
                <AppIcon name="info" size={14} />
                {t("chat.refusedLabel")}
              </span>
            ) : null}
            {message.refused ? <p>{message.text}</p> : <ChatMarkdown markdown={message.text} />}
            {message.refused ? null : <ChatCopyButton text={message.text} />}
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
