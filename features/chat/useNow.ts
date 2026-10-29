"use client";

import { useEffect, useState } from "react";

/** The current time, refreshed on an interval so a "resets in" countdown stays accurate while the panel is open. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
