/** Starter questions for an empty chat; the text lives in `chat.suggestions.<key>` in both languages. */
export const CHAT_SUGGESTION_KEYS = ["essayStructure", "fixSentence", "compareWords"] as const;

export type ChatSuggestionKey = (typeof CHAT_SUGGESTION_KEYS)[number];
