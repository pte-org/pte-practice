"use client";

import type { ReactElement, ReactNode } from "react";
import { AppIcon } from "./AppIcon";
import { Modal } from "./Modal";

/**
 * Ported from `pte-web/packages/ui/src/components/ConfirmDialog.tsx` (@pte/ui) with the same props, styled with
 * practice CSS tokens instead of Tailwind, so moving to the shared package later is only an import change.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Label of the close (x) button; defaults to cancelLabel. */
  closeLabel?: string;
  /** "accent" fills the confirm button with the common primary colour; the others keep it outlined. */
  tone?: "primary" | "accent" | "danger" | "warning";
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Action of the secondary button when it should differ from closing; the close (x) button still calls onClose. */
  onCancel?: () => void;
}

const CONFIRM_CLASS = {
  primary: "button-outline",
  accent: "button-primary",
  danger: "button-danger",
  warning: "button-outline",
} as const;

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  closeLabel = cancelLabel,
  tone = "primary",
  isConfirming = false,
  onConfirm,
  onClose,
  onCancel,
}: ConfirmDialogProps): ReactElement => {
  const cancelBtnClass = "button button-pill button-outline";

  return (
    <Modal
      open={open}
      title={title}
      titleIcon={tone === "warning" ? <span className="confirm-dialog-warning"><AppIcon name="info" size={18} /></span> : undefined}
      onClose={onClose}
      isDismissDisabled={isConfirming}
      size="sm"
      closeLabel={closeLabel}
      footer={(
        <>
          <button className={cancelBtnClass} type="button" onClick={onCancel ?? onClose} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button
            className={`button button-pill ${CONFIRM_CLASS[tone]}`}
            type="button"
            disabled={isConfirming}
            aria-busy={isConfirming}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      )}
    >
      <div className="confirm-dialog-description">{description}</div>
    </Modal>
  );
};
