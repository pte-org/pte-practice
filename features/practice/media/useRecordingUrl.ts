"use client";

import { useMemo, useSyncExternalStore } from "react";

/** Object URLs belong to the mounted preview, not to render or the persisted answer. */
function createPreview(blob: unknown) {
  let url: string | null = null;
  return {
    snapshot: (): string | null => url,
    subscribe: (notify: () => void): (() => void) => {
      if (blob instanceof Blob) {
        url = URL.createObjectURL(blob);
        notify();
      }
      return () => {
        if (url) URL.revokeObjectURL(url);
        url = null;
      };
    },
  };
}

export function useRecordingUrl(blob: unknown): string | null {
  const preview = useMemo(() => createPreview(blob), [blob]);
  return useSyncExternalStore(preview.subscribe, preview.snapshot, () => null);
}
