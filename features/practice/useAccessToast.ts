"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { accessStateForUi, usePractice } from "@/features/practice/PracticeProvider";
import { PRACTICE_STORAGE_KEYS } from "./constants";

const PRACTICE_UNLOCKED_TOAST_KEY = PRACTICE_STORAGE_KEYS.unlockedToast;

export function usePracticeAccessToast(): void {
  const { authStatus, entitlementStatus, entitlement, error } = usePractice();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const prevStateRef = useRef<string | null>(null);

  useEffect(() => {
    if (authStatus === "signed-out") {
      try {
        sessionStorage.removeItem(PRACTICE_UNLOCKED_TOAST_KEY);
      } catch {
        // sessionStorage might be restricted
      }
      prevStateRef.current = null;
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }

    const state = accessStateForUi(
      authStatus,
      entitlementStatus,
      entitlement?.practice.state ?? null,
    );

    if (state === "loading") {
      return;
    }

    const prevState = prevStateRef.current;
    if (prevState === state) {
      return;
    }
    prevStateRef.current = state;

    if (state === "unlocked") {
      let alreadyShown = false;
      try {
        alreadyShown = sessionStorage.getItem(PRACTICE_UNLOCKED_TOAST_KEY) === "true";
      } catch {
        alreadyShown = false;
      }

      if (!alreadyShown) {
        showToast(t("ui.accessUnlocked"), { tone: "success" });
        try {
          sessionStorage.setItem(PRACTICE_UNLOCKED_TOAST_KEY, "true");
        } catch {
          // ignore
        }
      }
    } else if (state === "locked") {
      const message = error ? t("ui.accessUnavailable") : t("ui.accessLocked");
      showToast(message, { tone: "warning" });
    } else if (state === "error") {
      showToast(t("ui.accessUnknown"), { tone: "warning" });
    }
  }, [authStatus, entitlementStatus, entitlement?.practice.state, error, showToast, t]);
}

export const useAccessToast = usePracticeAccessToast;
