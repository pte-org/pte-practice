"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseAppearance, readAppearanceSnapshot, subscribeAppearance } from "./preferences";
import type { PracticeAppearance } from "./types";

export function usePracticeAppearance(): PracticeAppearance {
  const raw = useSyncExternalStore(subscribeAppearance, readAppearanceSnapshot, () => null);
  return useMemo(() => parseAppearance(raw), [raw]);
}
