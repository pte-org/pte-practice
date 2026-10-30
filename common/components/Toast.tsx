// Ported from pte-web/packages/ui/src/components/Toast.tsx for pte-practice (Plan 261025-hung-practice-ui-polish)
"use client";

import { createPortal } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { useTranslation } from "@/common/i18n";
import { AppIcon } from "./AppIcon";
import {
  addToastToQueue,
  removeToastFromQueue,
  DEFAULT_TOAST_DURATION_MS,
  type ToastItem,
  type ToastTone,
} from "./toast-queue";

export type { ToastTone } from "./toast-queue";
export { DEFAULT_TOAST_DURATION_MS } from "./toast-queue";

export interface ShowToastOptions {
  tone?: ToastTone;
  /** How long the toast stays visible before auto-dismissing. Defaults to 5000ms. */
  durationMs?: number;
  /** Optional short heading shown above the message. */
  title?: string;
  /** Whether the toast includes a dismiss button. Defaults to true. */
  dismissible?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, "info" | "check" | "alert"> = {
  info: "info",
  success: "check",
  warning: "alert",
  error: "alert",
};

const emptySubscribe = () => () => {};

/** Mount once near the app root. Consume with `useToast()`. */
export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(
    () => () => {
      timeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.current.clear();
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((current) => removeToastFromQueue(current, id));
    const timeoutId = timeouts.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const tone: ToastTone = options?.tone ?? "success";
      const durationMs = options?.durationMs ?? DEFAULT_TOAST_DURATION_MS;

      const item: ToastItem = {
        id,
        tone,
        message,
        title: options?.title,
        dismissible: options?.dismissible ?? true,
      };

      setToasts((current) => addToastToQueue(current, item));

      if (durationMs > 0) {
        timeouts.current.set(
          id,
          setTimeout(() => dismiss(id), durationMs),
        );
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && typeof document !== "undefined" &&
        createPortal(
          <aside aria-live="polite" aria-atomic="false" className="toast-container">
            {toasts.map((toast) => {
              const iconName = TONE_ICON[toast.tone];
              const isAlert = toast.tone === "error" || toast.tone === "warning";
              return (
                <div
                  key={toast.id}
                  role={isAlert ? "alert" : "status"}
                  className="toast-item"
                >
                  <span aria-hidden="true" className={`toast-icon toast-icon-${toast.tone}`}>
                    <AppIcon name={iconName} size={18} />
                  </span>
                  <div className="toast-content">
                    {toast.title ? <p className="toast-title">{toast.title}</p> : null}
                    <p className="toast-message">{toast.message}</p>
                  </div>
                  {toast.dismissible ? (
                    <button
                      type="button"
                      aria-label={t("toast.close")}
                      onClick={() => dismiss(toast.id)}
                      className="toast-close"
                    >
                      <AppIcon name="close" size={16} />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </aside>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
