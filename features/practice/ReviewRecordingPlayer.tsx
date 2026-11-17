"use client";

import { useEffect, useRef, useState } from "react";
import { LoadingState } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "./api";
import { PromptAudioPlayer } from "./media/PromptAudioPlayer";

type PlayerState = { kind: "idle" } | { kind: "loading" } | { kind: "error" } | { kind: "ready"; url: string };

interface ReviewRecordingPlayerProps {
  api: Pick<PracticeApiClient, "getRecordingPlayback">;
  sessionId: string;
  itemId: string;
}

/**
 * Lets the learner listen to their own saved recording in the review. The link to a saved recording is short-lived,
 * so it is only requested when the learner asks to listen, never when the page opens.
 */
export function ReviewRecordingPlayer({ api, sessionId, itemId }: ReviewRecordingPlayerProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<PlayerState>({ kind: "idle" });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true; // StrictMode runs the cleanup once and mounts again in development
    return () => { mounted.current = false; };
  }, []);

  const load = () => {
    setState({ kind: "loading" });
    api.getRecordingPlayback(sessionId, itemId)
      .then((playback) => { if (mounted.current) setState({ kind: "ready", url: playback.url }); })
      .catch(() => { if (mounted.current) setState({ kind: "error" }); });
  };

  if (state.kind === "ready") {
    return <PromptAudioPlayer url={state.url} label={t("session.recordedAnswer")} interactive autoPlay />;
  }
  if (state.kind === "loading") return <LoadingState compact message={t("review.listenLoading")} />;
  return (
    <div className="review-recording-player">
      <button className="button button-outline button-pill" type="button" onClick={load}>
        {t("review.listenBack")}
      </button>
      {state.kind === "error" ? <p className="task-recording-message" role="alert">{t("review.playbackError")}</p> : null}
    </div>
  );
}
