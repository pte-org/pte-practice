"use client";

import { AppIcon } from "@/common/components";
import { accessStateForUi, usePractice } from "@/features/practice/PracticeProvider";
import { UI_TEXT } from "@/features/practice/constants";

export function AccessStatusBanner() {
  const { authStatus, entitlementStatus, entitlement, error, refresh } = usePractice();
  const state = accessStateForUi(authStatus, entitlementStatus, entitlement?.practice.state ?? null);

  if (state === "loading") {
    return (
      <div className="access-banner access-banner-loading" role="status">
        <span className="banner-icon-pulse" aria-hidden="true"><AppIcon name="lock" size={16} /></span>
        {UI_TEXT.accessChecking}…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="access-banner access-banner-error" role="alert">
        <span>{UI_TEXT.accessUnknown}</span>
        <button className="text-button" type="button" onClick={() => void refresh()}>
          {UI_TEXT.tryAgain}
        </button>
      </div>
    );
  }

  if (state === "unlocked") {
    return (
      <div className="access-banner access-banner-unlocked" role="status">
        <AppIcon name="check" size={16} />
        {UI_TEXT.accessUnlocked}
      </div>
    );
  }

  return (
    <div className="access-banner access-banner-locked" role="status">
      <AppIcon name="lock" size={16} />
      {error ? UI_TEXT.accessUnavailable : UI_TEXT.accessLocked}
    </div>
  );
}
