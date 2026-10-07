"use client";

import { COMMON_TEXT } from "../constants";
import { AppIcon } from "./AppIcon";

interface ErrorStateProps {
  reset: () => void;
}

export function ErrorState({ reset }: ErrorStateProps) {
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
