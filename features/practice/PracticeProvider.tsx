"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { COMMON_TEXT } from "@/features/common/constants";
import { createPracticeApiClient, PracticeApiError } from "./api";
import type { EntitlementState, PracticeCatalog, PracticeEntitlement } from "./contracts";
import { PREVIEW_CATALOG } from "./preview-catalog";
import { clearPracticeSession, getPracticeSession } from "./session-storage";

type AuthStatus = "loading" | "authenticated" | "signed-out";
type DataStatus = "idle" | "loading" | "ready" | "error";

interface PracticeContextValue {
  authStatus: AuthStatus;
  entitlementStatus: DataStatus;
  catalogStatus: DataStatus;
  entitlement: PracticeEntitlement | null;
  catalog: PracticeCatalog;
  error: PracticeApiError | null;
  isPracticeUnlocked: boolean;
  refresh: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
  signOut: () => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [entitlementStatus, setEntitlementStatus] = useState<DataStatus>("idle");
  const [catalogStatus, setCatalogStatus] = useState<DataStatus>("idle");
  const [entitlement, setEntitlement] = useState<PracticeEntitlement | null>(null);
  const [catalog, setCatalog] = useState<PracticeCatalog>(PREVIEW_CATALOG);
  const [error, setError] = useState<PracticeApiError | null>(null);
  const lastEntitlementRefresh = useRef(0);

  const signOut = useCallback(() => {
    clearPracticeSession();
    setAuthStatus("signed-out");
    setEntitlement(null);
    setEntitlementStatus("idle");
    setCatalogStatus("idle");
  }, []);

  const refreshEntitlement = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    const api = createPracticeApiClient();
    setEntitlementStatus("loading");
    try {
      const nextEntitlement = await api.getEntitlement();
      setEntitlement(nextEntitlement);
      setEntitlementStatus("ready");
      setError(null);
      lastEntitlementRefresh.current = Date.now();
    } catch (reason) {
      const apiError = toPracticeApiError(reason);
      setEntitlementStatus("error");
      setEntitlement(null);
      setError(apiError);
      if (apiError.status === 401) signOut();
    }
  }, [authStatus, signOut]);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setError(null);
    setCatalogStatus("loading");
    const api = createPracticeApiClient();
    const [entitlementResult, catalogResult] = await Promise.allSettled([
      api.getEntitlement(),
      api.getCatalog(),
    ]);

    if (entitlementResult.status === "fulfilled") {
      setEntitlement(entitlementResult.value);
      setEntitlementStatus("ready");
      lastEntitlementRefresh.current = Date.now();
    } else {
      const apiError = toPracticeApiError(entitlementResult.reason);
      setEntitlement(null);
      setEntitlementStatus("error");
      setError(apiError);
      if (apiError.status === 401) signOut();
    }

    if (catalogResult.status === "fulfilled") {
      setCatalog(catalogResult.value);
      setCatalogStatus("ready");
    } else {
      setCatalog(PREVIEW_CATALOG);
      setCatalogStatus("error");
      if (entitlementResult.status === "fulfilled") {
        setError(toPracticeApiError(catalogResult.reason));
      }
    }
  }, [authStatus, signOut]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = getPracticeSession();
      setAuthStatus(session ? "authenticated" : "signed-out");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [authStatus, refresh]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const refreshIfStale = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastEntitlementRefresh.current < 10_000) return;
      void refreshEntitlement();
    };

    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [authStatus, refreshEntitlement]);

  const value = useMemo<PracticeContextValue>(() => ({
    authStatus,
    entitlementStatus,
    catalogStatus,
    entitlement,
    catalog,
    error,
    isPracticeUnlocked: entitlement?.practice.state === "UNLOCKED",
    refresh,
    refreshEntitlement,
    signOut,
  }), [
    authStatus,
    catalog,
    catalogStatus,
    entitlement,
    entitlementStatus,
    error,
    refresh,
    refreshEntitlement,
    signOut,
  ]);

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice(): PracticeContextValue {
  const context = useContext(PracticeContext);
  if (!context) throw new Error("usePractice must be used inside PracticeProvider");
  return context;
}

export function accessStateForUi(
  authStatus: AuthStatus,
  entitlementStatus: DataStatus,
  entitlementState: EntitlementState | null,
): "loading" | "unlocked" | "locked" | "error" {
  if (authStatus === "loading" || entitlementStatus === "loading" || entitlementStatus === "idle") {
    return "loading";
  }
  if (entitlementStatus === "error") return "error";
  if (entitlementState === "UNLOCKED") return "unlocked";
  return "locked";
}

function toPracticeApiError(reason: unknown): PracticeApiError {
  if (reason instanceof PracticeApiError) return reason;
  return new PracticeApiError(COMMON_TEXT.genericErrorDescription, 0, "UNKNOWN_ERROR");
}
