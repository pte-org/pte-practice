import { asRecord } from "./contract-helpers";

export type WordMarkKind = "OMITTED" | "INSERTED";

export interface WordMark {
  word: string;
  mark: WordMarkKind;
}

/** What came with an AI score beyond its summary: a reason per trait, tips, and the word check of a read-out task. */
export interface PracticeAnswerFeedback {
  traitReasons: Record<string, string>;
  tips: string[];
  wordMarks: WordMark[];
}

/** Reads the feedback of a scored answer; null when the scorer wrote none (older results). */
export function normalizeAnswerFeedback(value: unknown): PracticeAnswerFeedback | null {
  const record = asRecord(value);
  const traitReasons = Object.fromEntries(Object.entries(asRecord(record.traitReasons))
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim() !== ""));
  const tips = Array.isArray(record.tips)
    ? record.tips.filter((tip): tip is string => typeof tip === "string" && tip.trim() !== "") : [];
  const wordMarks = Array.isArray(record.wordMarks) ? record.wordMarks.flatMap((entry) => {
    const mark = asRecord(entry);
    return typeof mark.word === "string" && (mark.mark === "OMITTED" || mark.mark === "INSERTED")
      ? [{ word: mark.word, mark: mark.mark as WordMarkKind }] : [];
  }) : [];
  if (Object.keys(traitReasons).length === 0 && tips.length === 0 && wordMarks.length === 0) return null;
  return { traitReasons, tips, wordMarks };
}
