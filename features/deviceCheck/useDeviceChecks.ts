"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { PRACTICE_STORAGE_KEYS } from "@/features/practice/constants";
import {
  clearCheckStatus,
  getCheckStatus,
  markCheckFailed,
  markCheckPassed,
  type DeviceCheckKind,
  type DeviceCheckStatus,
} from "./device-check";

const KINDS: readonly DeviceCheckKind[] = ["mic", "speaker", "keyboard", "reading"];
const CHANGE_EVENT = PRACTICE_STORAGE_KEYS.deviceCheckEvent;

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** A string snapshot ("1200": 1=passed, 2=failed, 0=not-checked) so React compares by value. */
const snapshot = () =>
  KINDS.map((kind) => {
    const s = getCheckStatus(kind);
    if (s === "passed") return "1";
    if (s === "failed") return "2";
    return "0";
  }).join("");

const serverSnapshot = () => "0000";

/** Which device checks this browser has passed, failed or not checked yet, and methods to update. */
export function useDeviceChecks(): {
  status: (kind: DeviceCheckKind) => DeviceCheckStatus;
  passed: (kind: DeviceCheckKind) => boolean;
  markPassed: (kind: DeviceCheckKind) => void;
  markFailed: (kind: DeviceCheckKind) => void;
  clearStatus: (kind: DeviceCheckKind) => void;
} {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const status = useCallback((kind: DeviceCheckKind): DeviceCheckStatus => {
    const code = state[KINDS.indexOf(kind)];
    if (code === "1") return "passed";
    if (code === "2") return "failed";
    return "not-checked";
  }, [state]);

  const passed = useCallback((kind: DeviceCheckKind) => status(kind) === "passed", [status]);

  const markPassed = useCallback((kind: DeviceCheckKind) => {
    markCheckPassed(kind);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const markFailed = useCallback((kind: DeviceCheckKind) => {
    markCheckFailed(kind);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const clearStatus = useCallback((kind: DeviceCheckKind) => {
    clearCheckStatus(kind);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  // Proactively sync microphone permission from browser
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let active = true;

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((permissionStatus) => {
        if (!active) return;
        if (permissionStatus.state === "denied") {
          markFailed("mic");
        } else if (permissionStatus.state === "granted" && getCheckStatus("mic") === "failed") {
          clearStatus("mic");
        }

        permissionStatus.onchange = () => {
          if (!active) return;
          if (permissionStatus.state === "denied") {
            markFailed("mic");
          } else if (permissionStatus.state === "granted" && getCheckStatus("mic") === "failed") {
            clearStatus("mic");
          }
        };
      })
      .catch(() => {
        // Microphone permission query not supported
      });

    return () => {
      active = false;
    };
  }, [clearStatus, markFailed]);

  return { status, passed, markPassed, markFailed, clearStatus };
}
