/**
 * Runs a session command that must not disturb the screen: it waits for any heartbeat to settle (so the version it
 * sends is current), runs the action, and reports failure to the caller instead of switching the session to the
 * error card. A recorder saving its draft uses this so a failed upload or save keeps the recording in memory and
 * the student can retry the save without losing it.
 */
export type BackgroundResult<T> = { ok: true; value: T } | { ok: false; reason: unknown };

export async function runInBackground<T>(steps: {
  settleHeartbeat: () => Promise<void>;
  action: () => Promise<T>;
}): Promise<BackgroundResult<T>> {
  try {
    await steps.settleHeartbeat();
    return { ok: true, value: await steps.action() };
  } catch (reason) {
    return { ok: false, reason };
  }
}
