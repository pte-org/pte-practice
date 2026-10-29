"use client";

import { useTranslation } from "@/common/i18n";
import { CHAT_SUGGESTION_KEYS } from "./chat-suggestions";

interface ChatSuggestionsProps {
  /** Fills the input; sending stays the student's own click, so nothing is charged by a tap on a chip. */
  onPick: (text: string) => void;
}

export function ChatSuggestions({ onPick }: ChatSuggestionsProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="chat-suggestions-title">{t("chat.suggestionsTitle")}</p>
      <div className="chat-suggestions">
        {CHAT_SUGGESTION_KEYS.map((key) => {
          const text = t(`chat.suggestions.${key}`);
          return (
            <button key={key} type="button" className="chat-suggestion" onClick={() => onPick(text)}>
              {text.trim()}
            </button>
          );
        })}
      </div>
    </>
  );
}
