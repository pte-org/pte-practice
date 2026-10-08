"use client";

import { useSyncExternalStore } from "react";
import { CONFIDENCE_HINT_KEY, dismissConfidenceHint, isConfidenceHintDismissed } from "./session-storage";
import { useTranslation } from "@/common/i18n";

export function ConfidenceHint() {
  const { t } = useTranslation();
  const dismissed = useSyncExternalStore(subscribe, isConfidenceHintDismissed, () => false);
  if (dismissed) return null;
  return (
    <aside className="confidence-hint" aria-label="Confidence rating guidance">
      <div><strong>{t("ui.confidenceHintTitle")}</strong><p>{t("ui.confidenceHintDescription")}</p></div>
      <button className="text-button" type="button" onClick={dismissConfidenceHint}>{t("ui.confidenceHintDismiss")}</button>
    </aside>
  );
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CONFIDENCE_HINT_KEY, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CONFIDENCE_HINT_KEY, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
