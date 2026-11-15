import type { PracticeTaskContent } from "./session-contracts";

type HintSource = Pick<PracticeTaskContent, "answerHintVi" | "answerHintEn"> | null | undefined;

/**
 * The hint lines to show for the interface language. A question may carry only one language, so the other one is
 * used as a fallback; an empty list means the hint card is not shown.
 */
export function answerHintLines(content: HintSource, locale: string): string[] {
  const preferred = locale === "vi" ? content?.answerHintVi : content?.answerHintEn;
  const fallback = locale === "vi" ? content?.answerHintEn : content?.answerHintVi;
  const text = preferred?.trim() || fallback?.trim() || "";
  return text.split(/\r?\n/).map((line) => line.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
}
