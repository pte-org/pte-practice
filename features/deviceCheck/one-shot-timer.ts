/** A timer that fires once and can be cancelled; starting it again replaces a pending run. */
export interface OneShotTimer {
  start: (callback: () => void, delayMs: number) => void;
  cancel: () => void;
  readonly pending: boolean;
}

export function createOneShotTimer(): OneShotTimer {
  let id: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (id !== null) clearTimeout(id);
    id = null;
  };
  return {
    start: (callback, delayMs) => {
      cancel();
      id = setTimeout(() => {
        id = null;
        callback();
      }, delayMs);
    },
    cancel,
    get pending() { return id !== null; },
  };
}

/** A timer that repeats until cancelled; starting it again replaces a running one. */
export interface IntervalTimer {
  start: (callback: () => void, everyMs: number) => void;
  cancel: () => void;
  readonly running: boolean;
}

export function createIntervalTimer(): IntervalTimer {
  let id: ReturnType<typeof setInterval> | null = null;
  const cancel = () => {
    if (id !== null) clearInterval(id);
    id = null;
  };
  return {
    start: (callback, everyMs) => {
      cancel();
      id = setInterval(callback, everyMs);
    },
    cancel,
    get running() { return id !== null; },
  };
}
