"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type SetActiveNav = (href: string | null) => void;

const ActiveNavContext = createContext<SetActiveNav | null>(null);

export function ActiveNavProvider({ onChange, children }: { onChange: SetActiveNav; children: ReactNode }) {
  return <ActiveNavContext value={onChange}>{children}</ActiveNavContext>;
}

/**
 * A page that is not a rail destination of its own names the item to light while it is open, and hands the choice
 * back to the path when it closes. Outside the shell (tests, previews) it does nothing.
 */
export function useActiveNav(href: string | null): void {
  const setActiveNav = useContext(ActiveNavContext);
  useEffect(() => {
    if (!setActiveNav) return;
    setActiveNav(href);
    return () => setActiveNav(null);
  }, [href, setActiveNav]);
}
