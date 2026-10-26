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
  tone?: "primary" | "danger" | "warning";
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  isConfirming = false,
  onConfirm,
  onClose,
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
      closeLabel={cancelLabel}
      footer={(
        <>
          <button className={cancelBtnClass} type="button" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button
            className={`button button-pill ${tone === "danger" ? "button-danger" : "button-outline"}`}
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
