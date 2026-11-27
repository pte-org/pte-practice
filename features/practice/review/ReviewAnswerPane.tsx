"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeReviewItem } from "../contracts";
import { parseBlankPrompt } from "../blank-prompt";
import { describeSavedAnswer } from "../review-answer";
import { ChoiceOptionList } from "../renderers/ChoiceOptionList";
import { reviewBlankRows, type ReviewBlankRow } from "./review-blank";
import { reviewChoiceView } from "./review-choice";

interface ReviewAnswerPaneProps {
  item: PracticeReviewItem;
  api: PracticeApiClient;
}

/** Left side of a reviewed question: the question text and what the student submitted, playable when recorded. */
export const ReviewAnswerPane = ({ item, api }: ReviewAnswerPaneProps): ReactElement => {
  const { t } = useTranslation();
  const choice = reviewChoiceView(item);
  const blanks = reviewBlankRows(item);
  return (
    <>
      {item.promptText ? (
        <section className="review-block review-block-question">
          <h4>{t("review.questionLabel")}</h4>
          <p className="review-prompt">
            {/* A blanks prompt marks its gaps as {{0}}; the review numbers them instead of showing the markers. */}
            {blanks ? parseBlankPrompt(item.promptText).map((segment, index) => segment.kind === "text"
              ? <span key={index}>{segment.text}</span>
              : <span key={index} className="review-blank-slot">{segment.index + 1}</span>)
              : item.promptText}
          </p>
        </section>
      ) : null}
      <section className="review-block review-block-answer">
        <h4>{t("review.answerPane")}</h4>
        {choice ? (
          <ChoiceOptionList options={choice.options} selected={choice.selected} multiple={choice.multiple} disabled
            verdicts={choice.verdicts} />
        ) : blanks ? <BlankRowList rows={blanks} /> : <SavedAnswerView item={item} api={api} />}
      </section>
    </>
  );
};

/** A marked fill-in-the-blanks answer: a row per gap with the word put in it and the word that belonged there. */
const BlankRowList = ({ rows }: { rows: readonly ReviewBlankRow[] }): ReactElement => {
  const { t } = useTranslation();
  return (
    <ol className="review-blank-rows">
      {rows.map((row) => (
        <li key={row.gap} className={`review-blank-row review-blank-row-${row.state}`}>
          <span className="review-blank-gap">{t("score.blankLabel")} {row.gap + 1}</span>
          <span className="review-blank-word">{row.chosenWord || "—"}</span>
          {row.state === "right"
            ? <span className="review-blank-verdict">{t("session.correct")}</span>
            : <span className="review-blank-verdict">{t("session.rightAnswer")}: <em>{row.correctWord || "—"}</em></span>}
        </li>
      ))}
    </ol>
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
