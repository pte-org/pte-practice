"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatApi } from "./api";
import { isChatUnavailable } from "./chat-availability";
import { chatErrorKey, type ChatErrorKey } from "./chat-errors";
import { isQuotaFresh } from "./chat-quota";
import type { ChatQuota } from "./contracts";

/**
 * The student's remaining questions for today. The server is the authority: this holds the last value it
 * reported (from the quota endpoint, a reply or a 429) and never counts down on its own. It also learns
 * whether chat exists for this student at all: `unavailable` turns true on a 403/404 and back on a good read.
 */
interface ChatQuotaState {
  quota: ChatQuota | null;
  setQuota: (quota: ChatQuota) => void;
  refresh: (maxAgeMs?: number) => Promise<void>;
  unavailable: boolean;
  errorKey: ChatErrorKey | null;
}

export function useChatQuota(api: ChatApi): ChatQuotaState {
  const [quota, setQuotaState] = useState<ChatQuota | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [errorKey, setErrorKey] = useState<ChatErrorKey | null>(null);
  const fetchedAt = useRef<number | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  /** Every value the server reports, however it arrives, counts as a fresh read. */
  const setQuota = useCallback((next: ChatQuota) => {
    fetchedAt.current = Date.now();
    setUnavailable(false);
    setErrorKey(null);
    setQuotaState(next);
  }, []);

  /** `maxAgeMs` lets a caller reuse a recent read instead of asking again; leave it out to always ask. */
  const refresh = useCallback((maxAgeMs = 0): Promise<void> => {
    // Opening, reset checks and repeated Retry clicks must share one response, not race to overwrite it.
    if (refreshInFlight.current) return refreshInFlight.current;
    if (isQuotaFresh(fetchedAt.current, Date.now(), maxAgeMs)) return Promise.resolve();
    const request = api.getQuota().then(setQuota).catch((error: unknown) => {
      // Preserve an earlier denial until a successful read proves access has recovered.
      if (isChatUnavailable(error)) setUnavailable(true);
      setErrorKey(chatErrorKey(error));
      fetchedAt.current = null;
    }).finally(() => { refreshInFlight.current = null; });
    refreshInFlight.current = request;
    return request;
  }, [api, setQuota]);

  return { quota, setQuota, refresh, unavailable, errorKey };
}
