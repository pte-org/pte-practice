"use client";

import { useState, type ReactElement } from "react";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { AppearanceSettings } from "@/features/practice/appearance/AppearanceSettings";
import { usePracticeAppearance } from "@/features/practice/appearance/usePracticeAppearance";
import { GeneralSettings } from "./GeneralSettings";
import { AssistantNameEditor } from "@/features/chat/AssistantNameEditor";
import "@/features/practice/appearance/appearance.css";
import "./settings.css";

export const StudentSettings = (): ReactElement => {
  const { t } = useTranslation();
  const appearance = usePracticeAppearance();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button className="icon-button student-settings-trigger" type="button" aria-label={t("settings.title")}
        title={t("settings.title")} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <AppIcon name="settings" size={20} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("settings.title")}
        closeLabel={t("mode.close")} size="md" isDismissDisabled={busy} className="student-settings-modal">
        {open ? <div className="student-settings-content">
          <GeneralSettings />
          <AssistantNameEditor />
          <section className="student-settings-appearance">
            <h3>{t("appearance.title")}</h3>
            <AppearanceSettings value={appearance} onBusyChange={setBusy} />
          </section>
        </div> : null}
      </Modal>
    </>
  );
};
