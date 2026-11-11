"use client";

import type { ReactElement, ReactNode } from "react";
import { AppIcon, CollapsibleSection } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { getTaskBriefing } from "../task-briefing";
import { useChatLauncher } from "@/features/chat/ChatLauncher";

interface PracticeSupportProps {
  taskCode: string;
  /** Question-specific hints can be supplied without changing the common frame. */
  hints?: ReactNode;
}

export const PracticeSupport = ({ taskCode, hints }: PracticeSupportProps): ReactElement => {
  const { t, locale } = useTranslation();
  const briefing = getTaskBriefing(taskCode);
  const chat = useChatLauncher();
  return (
    <aside className="practice-support" aria-label={t("session.supportTitle")}>
      <div className="practice-support-heading">
        <span className="practice-support-icon"><AppIcon name="sparkle" size={22} /></span>
        <div><h2>{t("session.supportTitle")}</h2><p>{t("session.supportSubtitle")}</p></div>
      </div>
      <CollapsibleSection title={t("progress.taskBriefingTipsHeader")} defaultExpanded icon={<AppIcon name="info" size={18} />}>
        <p>{locale === "vi" ? briefing.summaryVi : briefing.summaryEn}</p>
      </CollapsibleSection>
      <CollapsibleSection title={t("session.practiceTip")} defaultExpanded icon={<AppIcon name="check" size={18} />}>
        <p>{locale === "vi" ? briefing.tipVi : briefing.tipEn}</p>
      </CollapsibleSection>
      {hints}
      {chat ? <div className="practice-ai-entry">
        <span className="practice-ai-entry-title">
          <AppIcon name="sparkle" size={24} />
          <strong>{t("session.askAssistant")}</strong>
        </span>
        <p>{t("session.askAssistantDescription")}</p>
        <button type="button" className="button" onClick={chat.open}>{t("session.askAssistant")}</button>
      </div> : null}
    </aside>
  );
};
