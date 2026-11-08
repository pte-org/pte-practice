"use client";

import type { ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import { usePractice } from "./PracticeProvider";

export const PracticeAccessNotice = (): ReactElement | null => {
  const { accessState, catalogStatus, refresh, entitlementStatus } = usePractice();
  const { t } = useTranslation();
  const failed = accessState === "error" || catalogStatus === "error";
  const busy = entitlementStatus === "loading" || entitlementStatus === "refreshing" || catalogStatus === "loading";
  if (!failed && accessState !== "loading") return null;
  return (
    <div className="hint-strip" role="status" aria-live="polite">
      <p>{t(accessState === "error" ? "ui.accessUnknown" : catalogStatus === "error" ? "ui.catalogError" : "ui.accessChecking")}</p>
      {failed ? <button className="button button-outline" type="button" disabled={busy} onClick={() => void refresh()}>
        {t("common.tryAgain")}
      </button> : null}
    </div>
  );
};
