"use client";

import { useEffect } from "react";
import { shouldWarnOnLeave } from "./session-chrome";

/** While `busy`, closing or reloading the tab asks the browser's "leave site?" question so a recording is not lost. */
export function useLeaveGuard(busy: boolean): void {
  useEffect(() => {
    if (!shouldWarnOnLeave(busy)) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
}
