"use client";

import type { ReactElement } from "react";
import { AppIcon, CollapsibleSection } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { answerHintLines } from "../answer-hint";
import type { PracticeTaskContent } from "../session-contracts";

interface AnswerHintCardProps {
  content: PracticeTaskContent | null | undefined;
}

/** The question's own hint, closed until the learner asks for it; nothing is rendered when it has none. */
export const AnswerHintCard = ({ content }: AnswerHintCardProps): ReactElement | null => {
  const { t, locale } = useTranslation();
  const lines = answerHintLines(content, locale);
  if (lines.length === 0) return null;
  return (
    <CollapsibleSection title={t("session.answerHint")} defaultExpanded={false} icon={<AppIcon name="lightbulb" size={18} />}>
      <ul className="answer-hint-list">
        {lines.map((line, index) => <li key={index}>{line}</li>)}
      </ul>
    </CollapsibleSection>
  );
};
