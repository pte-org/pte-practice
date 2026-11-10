"use client";

import {
  createContext,
  type ReactNode,
  type ReactElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { COMMON_TEXT } from "@/common/constants";
import { createPracticeApiClient, PracticeApiError } from "./api";
import type { PracticeCatalog, PracticeEntitlement } from "./contracts";
import { PREVIEW_CATALOG } from "./preview-catalog";
import { clearPracticeDrafts, clearPracticeSession } from "./session-storage";
import { usePracticeLifecycle } from "./usePracticeLifecycle";
import { accessStateForUi, type PracticeAccessState, type PracticeAuthStatus as AuthStatus,
  type PracticeDataStatus as DataStatus } from "./access-state";
export { accessStateForUi } from "./access-state";

interface PracticeContextValue {
  authStatus: AuthStatus;
  entitlementStatus: DataStatus;
  catalogStatus: DataStatus;
  entitlement: PracticeEntitlement | null;
  catalog: PracticeCatalog;
  error: PracticeApiError | null;
  isPracticeUnlocked: boolean;
  accessState: PracticeAccessState;
  refresh: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
  signOut: () => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

interface PracticeProviderProps { children: ReactNode }

export const PracticeProvider = ({ children }: PracticeProviderProps): ReactElement => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [entitlementStatus, setEntitlementStatus] = useState<DataStatus>("idle");
  const [catalogStatus, setCatalogStatus] = useState<DataStatus>("idle");
  const [entitlement, setEntitlement] = useState<PracticeEntitlement | null>(null);
  const [catalog, setCatalog] = useState<PracticeCatalog>(PREVIEW_CATALOG);
  const [error, setError] = useState<PracticeApiError | null>(null);
  const lastEntitlementRefresh = useRef(0);
  const epoch = useRef(0);
  const entitlementFlight = useRef<Promise<void> | null>(null);
  const catalogSequence = useRef(0);

  // An expired or rejected token ends the session but keeps unsent drafts for the same student's next sign-in.
  const endSession = useCallback(() => {
    epoch.current += 1;
    entitlementFlight.current = null;
    clearPracticeSession();
    setAuthStatus("signed-out");
    setEntitlement(null);
    setEntitlementStatus("idle");
    setCatalogStatus("idle");
  }, []);

  const signOut = useCallback(() => {
    clearPracticeDrafts();
    endSession();
  }, [endSession]);

  const refreshEntitlement = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    if (entitlementFlight.current) return entitlementFlight.current;
    const generation = epoch.current;
    const api = createPracticeApiClient();
    setEntitlementStatus((current) => current === "ready" ? "refreshing" : "loading");
    const flight = (async (): Promise<void> => {
      try {
        const nextEntitlement = await api.getEntitlement();
        if (generation !== epoch.current) return;
        setEntitlement(nextEntitlement);
        setEntitlementStatus("ready");
        setError(null);
        lastEntitlementRefresh.current = Date.now();
      } catch (reason) {
        if (generation !== epoch.current) return;
        const apiError = toPracticeApiError(reason);
        setEntitlementStatus("error");
        setError(apiError);
        if (apiError.status === 401) endSession();
      }
    })();
    entitlementFlight.current = flight;
    try {
      await flight;
    } finally {
      if (entitlementFlight.current === flight) entitlementFlight.current = null;
    }
  }, [authStatus, endSession]);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    const generation = epoch.current;
    const sequence = ++catalogSequence.current;
    setCatalogStatus("loading");
    const api = createPracticeApiClient();
    const [, catalogResult] = await Promise.allSettled([
      refreshEntitlement(),
      api.getCatalog(),
    ]);
    if (generation !== epoch.current || sequence !== catalogSequence.current) return;
    if (catalogResult.status === "fulfilled") {
      setCatalog(catalogResult.value);
      setCatalogStatus("ready");
    } else {
      setCatalogStatus("error");
      const apiError = toPracticeApiError(catalogResult.reason);
      setError((current) => current ?? apiError);
      if (apiError.status === 401) endSession();
    }
  }, [authStatus, endSession, refreshEntitlement]);

  usePracticeLifecycle({ authStatus, setAuthStatus, endSession, refresh, lastChecked: lastEntitlementRefresh, epoch });

  const value = useMemo<PracticeContextValue>(() => ({
    authStatus,
    entitlementStatus,
    catalogStatus,
    entitlement,
    catalog,
    error,
    accessState: accessStateForUi(authStatus, entitlementStatus, entitlement?.practice.state ?? null),
    isPracticeUnlocked: accessStateForUi(authStatus, entitlementStatus, entitlement?.practice.state ?? null) === "unlocked",
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
};

export function usePractice(): PracticeContextValue {
  const context = useContext(PracticeContext);
  if (!context) throw new Error("usePractice must be used inside PracticeProvider");
  return context;
}

function toPracticeApiError(reason: unknown): PracticeApiError {
  if (reason instanceof PracticeApiError) return reason;
  return new PracticeApiError(COMMON_TEXT.genericErrorDescription, 0, "UNKNOWN_ERROR");
}
