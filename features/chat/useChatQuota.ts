"use client";

import { useCallback, useState } from "react";
import type { ChatApi } from "./api";
import type { ChatQuota } from "./contracts";

/**
 * The student's remaining questions for today. The server is the authority: this holds the last value it
 * reported (from the quota endpoint, a reply or a 429) and never counts down on its own.
 */
export function useChatQuota(api: ChatApi) {
  const [quota, setQuota] = useState<ChatQuota | null>(null);

  const refresh = useCallback(async () => {
    try {
      setQuota(await api.getQuota());
    } catch {
      // Keep the previous value: a failed refresh must not unlock or lock the composer by itself.
    }
  }, [api]);

  return { quota, setQuota, refresh };
}
