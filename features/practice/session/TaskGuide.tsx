"use client";

import { useState, type ReactElement } from "react";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { getTaskBriefing } from "../task-briefing";
import { taskDisplayName } from "../presentation";

export function TaskGuide({ taskCode }: { taskCode: string }): ReactElement {
  const [open, setOpen] = useState(false);
  const { t, locale } = useTranslation();
  const briefing = getTaskBriefing(taskCode);
  return (
    <>
      <button className="button button-outline" type="button" onClick={() => setOpen(true)}>
        <AppIcon name="info" size={16} />{t("progress.taskBriefingTipsHeader")}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} closeLabel={t("mode.close")} title={taskDisplayName(taskCode, taskCode, t)} size="sm">
        <p>{locale === "vi" ? briefing.summaryVi : briefing.summaryEn}</p>
        <p>{locale === "vi" ? briefing.tipVi : briefing.tipEn}</p>
      </Modal>
    </>
  );
}
