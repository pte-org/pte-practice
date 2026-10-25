/**
 * Tracks which of several overlapping loads is the latest, so a slow early response cannot overwrite a newer one.
 * `begin()` returns an id for the load; apply its result only while `isLatest(id)`. `cancel()` invalidates every
 * load (call it when the screen goes away).
 */
export interface LatestGate {
  begin(): number;
  isLatest(id: number): boolean;
  cancel(): void;
}

export function createLatestGate(): LatestGate {
  let latest = 0;
  let cancelled = false;
  return {
    begin() {
      cancelled = false;
      latest += 1;
      return latest;
    },
    isLatest(id) {
      return !cancelled && id === latest;
    },
    cancel() {
      cancelled = true;
    },
  };
}
