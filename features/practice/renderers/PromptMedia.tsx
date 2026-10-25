"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { PracticeTaskFixture } from "../fixtures";
import { createPlayOnceGuard } from "../timed/play-once";
import type { TimedRendererControl } from "./RendererTypes";

interface PromptMediaProps {
  fixture: PracticeTaskFixture;
  /** Set for a timed question: the audio plays once, with no controls and no seeking. */
  timed?: TimedRendererControl;
}

/** Prompt audio and image of the question; warns when the question has media that could not be loaded. */
export function PromptMedia({ fixture, timed }: PromptMediaProps) {
  const { t } = useLocale();
  const audioMissing = fixture.audioExpected && !fixture.audioUrl;
  const imageMissing = fixture.imageExpected && !fixture.imageUrl;
  if (!fixture.audioExpected && !fixture.imageExpected) return null;

  return (
    <div className="task-prompt-media">
      {fixture.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned, short-lived URL; not optimizable
        <img className="task-prompt-image" src={fixture.imageUrl} alt={t("score.imagePrompt")} />
      ) : null}
      {fixture.audioUrl && timed ? <OncePrompt url={fixture.audioUrl} timed={timed} label={t("score.audioPrompt")} /> : null}
      {fixture.audioUrl && !timed ? (
        <audio className="task-prompt-audio" src={fixture.audioUrl} controls preload="auto"
          aria-label={t("score.audioPrompt")} />
      ) : null}
      {audioMissing || imageMissing ? (
        <p className="task-recording-message" role="alert">{t("score.mediaUnavailable")}</p>
      ) : null}
    </div>
  );
}

/** Plays the prompt a single time when told to. `play()` resolving is what counts as the one play. */
function OncePrompt({ url, timed, label }: { url: string; timed: TimedRendererControl; label: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const guard = useRef(createPlayOnceGuard());
  const attempting = useRef(false);
  const { playPrompt, onPromptBlocked, onPromptError } = timed;

  useEffect(() => {
    const element = audio.current;
    if (!playPrompt || !element || attempting.current || !guard.current.canAttempt()) return;
    attempting.current = true;
    element.play().then(() => {
      guard.current.markPlayed();
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "NotAllowedError") onPromptBlocked();
      else onPromptError();
    }).finally(() => { attempting.current = false; });
  }, [playPrompt, url, onPromptBlocked, onPromptError]);

  return (
    <audio ref={audio} className="task-prompt-audio-once" src={url} preload="auto" aria-label={label}
      onEnded={timed.onPromptEnded} onError={() => { if (!guard.current.hasPlayed()) timed.onPromptError(); }} />
  );
}
