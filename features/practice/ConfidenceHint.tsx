"use client";

import { useSyncExternalStore } from "react";
import { UI_TEXT } from "./constants";
import { CONFIDENCE_HINT_KEY, dismissConfidenceHint, isConfidenceHintDismissed } from "./session-storage";

export function ConfidenceHint() {
  const dismissed = useSyncExternalStore(subscribe, isConfidenceHintDismissed, () => false);
  if (dismissed) return null;
  return (
    <aside className="confidence-hint" aria-label="Confidence rating guidance">
      <div><strong>{UI_TEXT.confidenceHintTitle}</strong><p>{UI_TEXT.confidenceHintDescription}</p></div>
      <button className="text-button" type="button" onClick={dismissConfidenceHint}>{UI_TEXT.confidenceHintDismiss}</button>
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
