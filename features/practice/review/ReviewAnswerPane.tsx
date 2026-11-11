"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeReviewItem } from "../contracts";
import { describeSavedAnswer } from "../review-answer";

interface ReviewAnswerPaneProps {
  item: PracticeReviewItem;
  api: PracticeApiClient;
}

/** Left side of a reviewed question: the question text and what the student submitted, playable when recorded. */
export const ReviewAnswerPane = ({ item, api }: ReviewAnswerPaneProps): ReactElement => {
  const { t } = useTranslation();
  return (
    <>
      {item.promptText ? (
        <section className="review-block review-block-question">
          <h4>{t("review.questionLabel")}</h4>
          <p className="review-prompt">{item.promptText}</p>
        </section>
      ) : null}
      <section className="review-block review-block-answer">
        <h4>{t("review.answerPane")}</h4>
        <SavedAnswerView item={item} api={api} />
      </section>
    </>
  );
};

const SavedAnswerView = ({ item, api }: ReviewAnswerPaneProps): ReactElement => {
  const { t } = useTranslation();
  const answer = describeSavedAnswer(item.savedPayload, item.promptText, item.options);
  switch (answer.kind) {
    case "empty":
      return <p className="review-answer review-answer-empty">{t("score.answerNotSubmitted")}</p>;
    case "audio":
      return (
        <RecordingPlayer api={api} mediaPublicId={answer.mediaPublicId} />
      );
    case "text":
      return <p className="review-answer review-answer-text">{answer.text}</p>;
    case "entries":
      return (
        <ol className="review-answer review-answer-list">
          {answer.entries.map((entry, index) => (
            <li key={index}>{entry.label ? <strong>{entry.label}. </strong> : null}{entry.value || "—"}</li>
          ))}
        </ol>
      );
    default:
      return <pre className="review-answer">{answer.text}</pre>;
  }
};

type RecordingState = { status: "loading" } | { status: "ready"; url: string } | { status: "error" };

/** The playback link is signed and short-lived, so it is fetched when the question is opened, not with the review. */
const RecordingPlayer = ({ api, mediaPublicId }: { api: PracticeApiClient; mediaPublicId: string }): ReactElement => {
  const { t } = useTranslation();
  const [state, setState] = useState<RecordingState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void api.getRecordingUrl(mediaPublicId)
      .then((url) => { if (active) setState(url ? { status: "ready", url } : { status: "error" }); })
      .catch(() => { if (active) setState({ status: "error" }); });
    return () => { active = false; };
  }, [api, mediaPublicId]);

  if (state.status === "loading") return <p className="review-recording-note">{t("review.recordingLoading")}</p>;
  if (state.status === "error") return <p className="review-recording-note">{t("review.recordingUnavailable")}</p>;
  return <audio className="review-audio" controls preload="metadata" src={state.url} />;
};
