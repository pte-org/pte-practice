"use client";

import { type ReactElement, type ReactNode, useEffect, useId, useRef } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

/** Props mirror `Modal` in `@pte/ui` so moving to the shared package later is only an import change. */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnBackdropClick?: boolean;
  /** Blocks Escape, the backdrop and the close button, for example while a request is in flight. */
  isDismissDisabled?: boolean;
  /** Accessible name for the close button, already translated. */
  closeLabel?: string;
}

const BODY_LOCK_CLASS = "modal-open";

export function Modal({
  open,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  size = "md",
  className,
  closeOnBackdropClick = true,
  isDismissDisabled = false,
  closeLabel,
}: ModalProps): ReactElement | null {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add(BODY_LOCK_CLASS);
    dialogRef.current?.focus();
    return () => {
      document.body.classList.remove(BODY_LOCK_CLASS);
      returnFocusTo.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || isDismissDisabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isDismissDisabled]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdropClick && !isDismissDisabled) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal-dialog modal-${size}${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {title ? (
          <header className="modal-header">
            {titleIcon ? <span className="modal-title-icon" aria-hidden="true">{titleIcon}</span> : null}
            <h2 id={titleId}>{title}</h2>
            {closeLabel ? (
              <button className="icon-button modal-close" type="button" onClick={onClose}
                disabled={isDismissDisabled} aria-label={closeLabel}>×</button>
            ) : null}
          </header>
        ) : null}
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
