import type { ReactElement } from "react";
import type { ToastTone } from "./toast-queue";

interface ToastIconProps {
  tone: ToastTone | "close";
}

/** Same glyphs as pte-web's shared Toast, kept local for this standalone app. */
export const ToastIcon = ({ tone }: ToastIconProps): ReactElement => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={tone === "close" ? 1.75 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tone === "close" ? (
      <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
    ) : tone === "error" || tone === "warning" ? (
      <><path d="M12 4 2.5 20h19L12 4z" /><path d="M12 10v4M12 18h.01" /></>
    ) : tone === "success" ? (
      <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>
    ) : (
      <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>
    )}
  </svg>
);
