"use client";

import { useEffect, useState } from "react";
import type { PracticeApiClient } from "./api";

/** A review list mounts one score view per answer; they share one read of the switch for this long. */
const SWITCH_CACHE_MS = 30_000;

let cached: { at: number; value: Promise<boolean> } | null = null;

function readSwitch(api: PracticeApiClient): Promise<boolean> {
  const now = Date.now();
  if (!cached || now - cached.at > SWITCH_CACHE_MS) cached = { at: now, value: api.isPracticeScoringOn() };
  return cached.value;
}

/** Whether the platform admin has AI practice scoring on; assumed on until the server says otherwise. */
export function usePracticeScoringSwitch(api: PracticeApiClient): boolean {
  const [scoringOn, setScoringOn] = useState(true);
  useEffect(() => {
    let active = true;
    void readSwitch(api).then((value) => { if (active) setScoringOn(value); });
    return () => { active = false; };
  }, [api]);
  return scoringOn;
}
