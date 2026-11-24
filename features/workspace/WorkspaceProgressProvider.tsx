"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLatestRequest } from "@/common/hooks/useLatestRequest";
import { createPracticeApiClient } from "@/features/practice/api";
import type { PracticeProgress } from "@/features/practice/contracts";
import { usePractice } from "@/features/practice/PracticeProvider";
import { EMPTY_WORKSPACE_PROGRESS, WORKSPACE_PROGRESS_STALE_MS } from "./constants";

interface WorkspaceProgress {
  progress: PracticeProgress;
  status: "loading" | "ready" | "error";
  refresh: () => Promise<void>;
}

const WorkspaceProgressContext = createContext<WorkspaceProgress | null>(null);
interface WorkspaceProgressProviderProps { children: ReactNode }

/** One history request serves the shared widgets, task rows and Progress screen. */
export const WorkspaceProgressProvider = ({ children }: WorkspaceProgressProviderProps): ReactElement => {
  const { authStatus } = usePractice();
  const pathname = usePathname();
  const [progress, setProgress] = useState<PracticeProgress>(EMPTY_WORKSPACE_PROGRESS);
  const [status, setStatus] = useState<WorkspaceProgress["status"]>("loading");
  const api = useMemo(() => createPracticeApiClient(), []);
  const gate = useLatestRequest();
  const inFlight = useRef<Promise<void> | null>(null);
  const lastAttempt = useRef(0);
  const refresh = useCallback(async (background = false): Promise<void> => {
    if (authStatus !== "authenticated") return;
    if (inFlight.current) return inFlight.current;
    const id = gate.begin();
    lastAttempt.current = Date.now();
    if (!background) setStatus("loading");
    const request = (async (): Promise<void> => {
      try {
        const loaded = await api.getProgress();
        if (!gate.isLatest(id)) return;
        setProgress(loaded);
        setStatus("ready");
      } catch {
        if (gate.isLatest(id)) setStatus("error");
      }
    })();
    inFlight.current = request;
    try {
      await request;
    } finally {
      if (inFlight.current === request) inFlight.current = null;
    }
  }, [api, authStatus, gate]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => {
      window.clearTimeout(timer);
      gate.cancel();
      inFlight.current = null;
    };
  }, [gate, refresh]);
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const revalidate = (): void => {
      if (document.visibilityState === "visible" && Date.now() - lastAttempt.current >= WORKSPACE_PROGRESS_STALE_MS) {
        void refresh(true);
      }
    };
    const onOnline = (): void => { void refresh(true); };
    revalidate();
    const timer = window.setInterval(revalidate, WORKSPACE_PROGRESS_STALE_MS);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("online", onOnline);
    };
  }, [authStatus, pathname, refresh]);
  const value = useMemo<WorkspaceProgress>(() => ({ progress, status, refresh }), [progress, status, refresh]);
  return <WorkspaceProgressContext.Provider value={value}>{children}</WorkspaceProgressContext.Provider>;
};

export const useWorkspaceProgress = (): WorkspaceProgress => {
  const context = useContext(WorkspaceProgressContext);
  if (!context) throw new Error("Workspace progress requires WorkspaceProgressProvider");
  return context;
};
