export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  title?: string;
  dismissible: boolean;
}

export const DEFAULT_TOAST_DURATION_MS = 5000;
export const MAX_VISIBLE_TOASTS = 3;

/** Pure helper to manage toast queue length. */
export function addToastToQueue(current: ToastItem[], item: ToastItem, max = MAX_VISIBLE_TOASTS): ToastItem[] {
  return [...current, item].slice(-max);
}

/** Pure helper to dismiss a toast from the queue. */
export function removeToastFromQueue(current: ToastItem[], id: string): ToastItem[] {
  return current.filter((item) => item.id !== id);
}
