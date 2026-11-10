"use client";

import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { PracticeAuthStatus } from "./access-state";
import { ENTITLEMENT_STALE_THRESHOLD_MS, PRACTICE_SESSION_CLEARED_EVENT, PRACTICE_STORAGE_KEYS } from "./constants";
import { getPracticeSession } from "./session-storage";

interface PracticeLifecycleOptions {
  authStatus: PracticeAuthStatus;
  setAuthStatus: Dispatch<SetStateAction<PracticeAuthStatus>>;
  endSession: () => void;
  refresh: () => Promise<void>;
  lastChecked: RefObject<number>;
  epoch: RefObject<number>;
}

export const usePracticeLifecycle = ({ authStatus, setAuthStatus, endSession, refresh,
  lastChecked, epoch }: PracticeLifecycleOptions): void => {
  useEffect(() => {
    const onCleared = (): void => { if (!getPracticeSession()) endSession(); };
    const onStorage = (event: StorageEvent): void => {
      if (event.key === PRACTICE_STORAGE_KEYS.session || event.key === null) onCleared();
    };
    window.addEventListener(PRACTICE_SESSION_CLEARED_EVENT, onCleared);
    window.addEventListener("storage", onStorage);
    const timer = window.setTimeout(() => setAuthStatus(getPracticeSession() ? "authenticated" : "signed-out"), 0);
    return () => {
      epoch.current += 1;
      window.clearTimeout(timer);
      window.removeEventListener(PRACTICE_SESSION_CLEARED_EVENT, onCleared);
      window.removeEventListener("storage", onStorage);
    };
  }, [endSession, epoch, setAuthStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [authStatus, refresh]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const onFocus = (): void => {
      if (document.visibilityState === "visible" && Date.now() - lastChecked.current >= ENTITLEMENT_STALE_THRESHOLD_MS) {
        void refresh();
      }
    };
    const onOnline = (): void => { void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [authStatus, lastChecked, refresh]);
};
