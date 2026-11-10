import { PIP_REMINDER_INTERVAL_MS } from "./constants";

/** Background tabs stay quiet; callers cancel and restart the interval after a manual greeting. */
export function schedulePipEncouragement(encourage: () => void, isVisible: () => boolean): () => void {
  const interval = setInterval(() => { if (isVisible()) encourage(); }, PIP_REMINDER_INTERVAL_MS);
  return () => clearInterval(interval);
}
