import type { ReactElement } from "react";
import "./error-banner.css";

interface ErrorBannerProps {
  message: string;
  /** Shows a retry button when given. */
  onRetry?: () => void;
  retryLabel?: string;
  retryDisabled?: boolean;
  className?: string;
}

/** A page-level failure (could not load, server unreachable): centred, in the warning colours, with an optional retry. */
export const ErrorBanner = ({ message, onRetry, retryLabel, retryDisabled = false, className }: ErrorBannerProps): ReactElement => (
  <div className={`error-banner${className ? ` ${className}` : ""}`} role="alert">
    <p>{message}</p>
    {onRetry && retryLabel ? (
      <button className="button button-outline" type="button" disabled={retryDisabled} onClick={onRetry}>{retryLabel}</button>
    ) : null}
  </div>
);
