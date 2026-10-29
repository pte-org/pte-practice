"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatApi } from "./api";
import { isChatUnavailable } from "./chat-availability";
import { isQuotaFresh } from "./chat-quota";
import type { ChatQuota } from "./contracts";

/**
 * The student's remaining questions for today. The server is the authority: this holds the last value it
 * reported (from the quota endpoint, a reply or a 429) and never counts down on its own. It also learns
 * whether chat exists for this student at all: `unavailable` turns true on a 403/404 and back on a good read.
 */
export function useChatQuota(api: ChatApi) {
  const [quota, setQuotaState] = useState<ChatQuota | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const fetchedAt = useRef<number | null>(null);

  /** Every value the server reports, however it arrives, counts as a fresh read. */
  const setQuota = useCallback((next: ChatQuota) => {
    fetchedAt.current = Date.now();
    setUnavailable(false);
    setQuotaState(next);
  }, []);

  /** `maxAgeMs` lets a caller reuse a recent read instead of asking again; leave it out to always ask. */
  const refresh = useCallback(async (maxAgeMs = 0) => {
    if (isQuotaFresh(fetchedAt.current, Date.now(), maxAgeMs)) return;
    try {
      setQuota(await api.getQuota());
    } catch (error) {
      // Keep the previous value: a failed refresh must not unlock or lock the composer by itself.
      if (isChatUnavailable(error)) setUnavailable(true);
    }
  }, [api, setQuota]);

  return { quota, setQuota, refresh, unavailable };
}
