"use client";

import { useLocale } from "../../../common/i18n/LocaleProvider";
import type { PracticeTaskFixture } from "../fixtures";

/** Prompt audio and image of the question; warns when the question has media that could not be loaded. */
export function PromptMedia({ fixture }: { fixture: PracticeTaskFixture }) {
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
      {fixture.audioUrl ? (
        <audio className="task-prompt-audio" src={fixture.audioUrl} controls preload="auto"
          aria-label={t("score.audioPrompt")} />
      ) : null}
      {audioMissing || imageMissing ? (
        <p className="task-recording-message" role="alert">{t("score.mediaUnavailable")}</p>
      ) : null}
    </div>
  );
}
