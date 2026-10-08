"use client";

import { AppIcon } from "@/common/components";
import { accessStateForUi, usePractice } from "@/features/practice/PracticeProvider";
import { useTranslation } from "@/common/i18n";

export function AccessStatusBanner() {
  const { authStatus, entitlementStatus, entitlement, error, refresh } = usePractice();
  const { t } = useTranslation();
  const state = accessStateForUi(authStatus, entitlementStatus, entitlement?.practice.state ?? null);

  if (state === "loading") {
    return (
      <div className="access-banner access-banner-loading" role="status">
        <span className="banner-icon-pulse" aria-hidden="true"><AppIcon name="lock" size={16} /></span>
        {t("ui.accessChecking")}…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="access-banner access-banner-error" role="alert">
        <span>{t("ui.accessUnknown")}</span>
        <button className="text-button" type="button" onClick={() => void refresh()}>
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }

  if (state === "unlocked") {
    return (
      <div className="access-banner access-banner-unlocked" role="status">
        <AppIcon name="check" size={16} />
        {t("ui.accessUnlocked")}
      </div>
    );
  }

  return (
    <div className="access-banner access-banner-locked" role="status">
      <AppIcon name="lock" size={16} />
      {error ? t("ui.accessUnavailable") : t("ui.accessLocked")}
    </div>
  );
}
