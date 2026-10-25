"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isCheckPassed, markCheckPassed, type DeviceCheckKind } from "./device-check";

const KINDS: readonly DeviceCheckKind[] = ["mic", "speaker", "keyboard", "reading"];
const CHANGE_EVENT = "pte.practice.device-check-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** A string snapshot ("1010") so React can compare it by value; the server render knows nothing is checked. */
const snapshot = () => KINDS.map((kind) => (isCheckPassed(kind) ? "1" : "0")).join("");
const serverSnapshot = () => "0000";

/** Which device checks this browser has passed recently, and a way to record a new pass. */
export function useDeviceChecks(): { passed: (kind: DeviceCheckKind) => boolean; markPassed: (kind: DeviceCheckKind) => void } {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const passed = useCallback((kind: DeviceCheckKind) => state[KINDS.indexOf(kind)] === "1", [state]);
  const markPassed = useCallback((kind: DeviceCheckKind) => {
    markCheckPassed(kind);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return { passed, markPassed };
}
