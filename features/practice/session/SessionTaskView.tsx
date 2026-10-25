"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeItemResult, PracticeSession, PracticeTaskResponse } from "../contracts";
import type { PracticeTaskFixture } from "../fixtures";
import { skillKey } from "../presentation";
import { isClientRuntimeSupported } from "../renderer-allowlist";
import { TaskRenderer } from "../renderers/TaskRenderer";
import type { TaskRendererProps, TimedRendererControl } from "../renderers/RendererTypes";
import { TimedTaskFrame } from "../timed/TimedTaskFrame";
import { shouldMountTimedFrame } from "../timed/timed-frame";
import { FieldWarning } from "./FieldWarning";
import { InlineResultCard } from "./InlineResultCard";
import { sessionParts } from "./session-chrome";
import { SessionFooter, SessionHeader } from "./SessionChrome";
import { currentTaskPosition } from "./session-draft";

export type MissingField = "answer" | null;

interface SessionTaskViewProps {
  api: PracticeApiClient;
  session: PracticeSession;
  task: PracticeTaskResponse;
  fixture: PracticeTaskFixture | null;
  /** The name of the session shown in the header ("Luyện Đọc · 10 câu", a mock test title…). */
  title: string;
  /** A command is running: inputs and buttons are disabled. */
  busy: boolean;
  /** A recording is being made or uploaded: pausing and moving on wait for it. */
  recorderBusy: boolean;
  /** No network: answers are kept but cannot be sent. */
  offline: boolean;
  /** Inline notice (for example a failed heartbeat) that does not replace the task. */
  notice: string | null;
  missing: MissingField;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onUploadRecording: TaskRendererProps["onUploadRecording"];
  onLoadPlayback: TaskRendererProps["onLoadPlayback"];
  onActivityChange: (busy: boolean) => void;
  /** Reloads the session so the prompt gets a fresh media link. */
  onRefreshPrompt: () => Promise<void>;
  onSubmit: () => void;
  onSkip?: () => void;
  onPause: () => void;
  /** Current question has been submitted and is displaying results inline. */
  isSubmitted?: boolean;
  result?: PracticeItemResult | null;
  timeSpentSeconds?: number;
  onResultSettled?: (result: PracticeItemResult) => void;
  showPrev?: boolean;
  onPrev?: () => void;
  prevDisabled?: boolean;
  showSkip?: boolean;
  showSubmit?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  onSubmitAnswer?: () => void;
  showNext?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
}

/** One question of the session page: header, segmented progress, the task in a card, and the bottom bar. */
export function SessionTaskView(props: SessionTaskViewProps) {
  const {
    api,
    session,
    task,
    fixture,
    busy,
    recorderBusy,
    offline,
    notice,
    missing,
    value,
    isSubmitted = false,
    result = null,
    timeSpentSeconds,
    showPrev = false,
    onPrev,
    prevDisabled = false,
    nextLabel,
  } = props;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const answerCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice) showToast(notice, { tone: "error" });
  }, [notice, showToast]);

  const unsupported = !isClientRuntimeSupported(task.rendererKey) || !fixture;
  // Read-aloud, written-text, blank and highlight renderers draw the passage themselves; showing it here too doubles it.
  const rendererShowsPrompt = Boolean(fixture?.text || fixture?.tokens);
  const promptText = fixture ? (rendererShowsPrompt ? "" : fixture.prompt) : t("ui.sessionUnsupported");
  const timing = task.timing;
  const isSpeaking = task.section === "SPEAKING";
  const hasSavedRecording = typeof value.mediaPublicId === "string" && value.mediaPublicId.length > 0;
  const timedFrame = shouldMountTimedFrame(session) && timing && fixture && !unsupported && !isSubmitted ? timing : null;
  const skill = skillKey(task.section);
  const locked = busy || offline;

  const renderBody = (timed?: TimedRendererControl, timedLocked = false, attempt = 0) => fixture ? (
    <TaskRenderer key={attempt} fixture={fixture} rendererKey={task.rendererKey} value={value}
      sessionPublicId={session.publicId} itemPublicId={task.publicId} timed={timed}
      onUploadRecording={props.onUploadRecording} onLoadPlayback={props.onLoadPlayback}
      onActivityChange={props.onActivityChange}
      disabled={busy || unsupported || timedLocked || isSubmitted} onChange={props.onChange} />
  ) : <div className="task-unsupported" role="status"><p>{t("ui.sessionUnsupported")}</p></div>;

  useEffect(() => {
    if (missing === "answer") answerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [missing]);

  const questionNum = typeof task.orderIndex === "number" && task.orderIndex >= 0
    ? task.orderIndex + 1
    : currentTaskPosition(session);

  return (
    <section className="exam-shell practice-session" data-testid="practice-session">
      <SessionHeader title={props.title} subtitle={skill ? t(skill) : task.section}
        parts={sessionParts(session)} questionNumber={questionNum} questionCount={session.totalItemCount}
        pauseDisabled={locked || recorderBusy}
        pauseLabel={recorderBusy ? t("session.savingRecording") : t("session.pause")} onPause={props.onPause} />
      <div className="exam-body">
        <div className="exam-task-heading">
          <h2>{task.displayName}</h2>
          <p>{fixture?.instruction ?? t("ui.sessionAnswerTaskBelow")}</p>
        </div>
        <div ref={answerCardRef} className={`exam-task-card${missing === "answer" ? " field-missing" : ""}`}>
          {promptText ? <p className="session-task-prompt">{promptText}</p> : null}
          {timedFrame && fixture ? (
            <TimedTaskFrame key={task.publicId} timing={timedFrame} isSpeaking={isSpeaking}
              hasPromptAudio={Boolean(fixture.audioUrl)} hasSavedRecording={isSpeaking && hasSavedRecording}
              onRefreshPrompt={props.onRefreshPrompt}>
              {({ timed, locked: frameLocked, attempt }) => renderBody(timed, frameLocked, attempt)}
            </TimedTaskFrame>
          ) : renderBody()}
          {missing === "answer" ? <FieldWarning message={t("ui.sessionNoAnswer")} /> : null}
        </div>
        {isSubmitted ? (
          <InlineResultCard
            api={api}
            sessionId={session.publicId}
            itemId={task.publicId}
            initialResult={result}
            timeSpentSeconds={timeSpentSeconds}
            onResultSettled={props.onResultSettled}
          />
        ) : null}
      </div>
      <SessionFooter
        busy={locked}
        showPrev={showPrev}
        onPrev={onPrev}
        prevDisabled={prevDisabled}
        showSkip={props.showSkip}
        skipDisabled={locked || recorderBusy}
        onSkip={props.onSkip}
        showSubmit={props.showSubmit}
        submitDisabled={locked || unsupported || recorderBusy || props.submitDisabled}
        submitLabel={props.submitLabel}
        onSubmit={props.onSubmitAnswer}
        showNext={props.showNext}
        nextDisabled={locked || unsupported || recorderBusy || props.nextDisabled}
        nextLabel={recorderBusy ? t("session.savingRecording") : (nextLabel ?? t("session.next"))}
        onNext={props.onSubmit}
      />
    </section>
  );
}
