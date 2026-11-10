"use client";

import { useEffect } from "react";
import { shouldWarnOnLeave } from "./session-chrome";

/** While `busy`, closing or reloading the tab asks the browser's "leave site?" question so a recording is not lost. */
export function useLeaveGuard(busy: boolean, onBlocked?: () => void): void {
  useEffect(() => {
    if (!shouldWarnOnLeave(busy)) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    const currentUrl = window.location.href;
    const currentState: unknown = window.history.state;
    const blockBack = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      window.history.pushState(currentState, "", currentUrl);
      onBlocked?.();
    };
    const blockLink = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.href === currentUrl) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onBlocked?.();
    };
    // Capture runs before the router, so it cannot unmount the in-memory recording first.
    window.addEventListener("popstate", blockBack, true);
    document.addEventListener("click", blockLink, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("popstate", blockBack, true);
      document.removeEventListener("click", blockLink, true);
    };
  }, [busy, onBlocked]);
}
