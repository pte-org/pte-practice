"use client";

import type { ReactElement } from "react";
import { ErrorBanner } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { usePractice } from "./PracticeProvider";
import { NETWORK_ERROR_CODE } from "./constants";

export const PracticeAccessNotice = (): ReactElement | null => {
  const { accessState, catalogStatus, refresh, entitlementStatus, error } = usePractice();
  const { t } = useTranslation();
  const failed = accessState === "error" || catalogStatus === "error";
  const busy = entitlementStatus === "loading" || entitlementStatus === "refreshing" || catalogStatus === "loading";
  if (!failed && accessState !== "loading") return null;
  if (!failed) {
    return <div className="hint-strip" role="status" aria-live="polite"><p>{t("ui.accessChecking")}</p></div>;
  }
  return (
    <ErrorBanner retryLabel={t("common.tryAgain")} retryDisabled={busy} onRetry={() => void refresh()}
      // The session is kept on an outage, so name the outage instead of suggesting an access problem.
      message={t(error?.code === NETWORK_ERROR_CODE ? "ui.serverUnreachable"
        : accessState === "error" ? "ui.accessUnknown" : "ui.catalogError")} />
  );
};
