/**
 * The prompt of a timed question plays exactly once. The guard is claimed only after `play()` has resolved: a load
 * error or a blocked autoplay before that is not a play, so the attempt can be repeated with a fresh link or after a
 * gesture, and the prompt still counts as played only once.
 */
export interface PlayOnceGuard {
  canAttempt: () => boolean;
  markPlayed: () => void;
  hasPlayed: () => boolean;
  /** Forget the play, for "retry this question". */
  reset: () => void;
}

export function createPlayOnceGuard(): PlayOnceGuard {
  let played = false;
  return {
    canAttempt: () => !played,
    markPlayed: () => { played = true; },
    hasPlayed: () => played,
    reset: () => { played = false; },
  };
}

/** A command that may be issued once per run, even when an effect runs twice (React StrictMode). */
export interface OnceCommand {
  /** True the first time it is called after creation or `reset`, false afterwards. */
  fire: () => boolean;
  reset: () => void;
}

export function createOnceCommand(): OnceCommand {
  let fired = false;
  return {
    fire: () => {
      if (fired) return false;
      fired = true;
      return true;
    },
    reset: () => { fired = false; },
  };
}
