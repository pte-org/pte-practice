"use client";

import type { ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import { usePractice } from "./PracticeProvider";
import { NETWORK_ERROR_CODE } from "./constants";

export const PracticeAccessNotice = (): ReactElement | null => {
  const { accessState, catalogStatus, refresh, entitlementStatus, error } = usePractice();
  const { t } = useTranslation();
  const failed = accessState === "error" || catalogStatus === "error";
  const busy = entitlementStatus === "loading" || entitlementStatus === "refreshing" || catalogStatus === "loading";
  if (!failed && accessState !== "loading") return null;
  return (
    <div className="hint-strip" role="status" aria-live="polite">
      <p>{t(!failed ? "ui.accessChecking"
        // The session is kept on an outage, so name the outage instead of suggesting an access problem.
        : error?.code === NETWORK_ERROR_CODE ? "ui.serverUnreachable"
        : accessState === "error" ? "ui.accessUnknown" : "ui.catalogError")}</p>
      {failed ? <button className="button button-outline" type="button" disabled={busy} onClick={() => void refresh()}>
        {t("common.tryAgain")}
      </button> : null}
    </div>
  );
};
