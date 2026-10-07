"use client";

import { AppIcon } from "@/features/icons/AppIcon";
import { COMMON_TEXT } from "@/features/common/constants";

export default function StudentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <div className="empty-state error-state">
        <span className="empty-icon" aria-hidden="true"><AppIcon name="info" size={23} /></span>
        <h1>{COMMON_TEXT.genericErrorTitle}</h1>
        <p>{COMMON_TEXT.genericErrorDescription}</p>
        <button className="button button-primary" type="button" onClick={reset}>
          {COMMON_TEXT.tryAgain}
        </button>
      </div>
    </main>
  );
}
