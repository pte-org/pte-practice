"use client";

import { useEffect, useRef } from "react";
import { ProgressRing, useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeSession, PracticeTaskResponse } from "../contracts";
import type { PracticeTaskFixture } from "../fixtures";
import { isClientRuntimeSupported } from "../renderer-allowlist";
import { TaskRenderer } from "../renderers/TaskRenderer";
import type { TaskRendererProps, TimedRendererControl } from "../renderers/RendererTypes";
import { TimedTaskFrame } from "../timed/TimedTaskFrame";
import { shouldMountTimedFrame } from "../timed/timed-frame";
import { FieldWarning } from "./FieldWarning";
import { currentTaskPosition, progressFor } from "./session-draft";

export type MissingField = "answer" | null;

interface SessionTaskViewProps {
  session: PracticeSession;
  task: PracticeTaskResponse;
  fixture: PracticeTaskFixture | null;
  /** A command is running: inputs and buttons are disabled. */
  busy: boolean;
  /** Inline notice (for example a failed heartbeat) that does not replace the task. */
  notice: string | null;
  missing: MissingField;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onUploadRecording: TaskRendererProps["onUploadRecording"];
  onLoadPlayback: TaskRendererProps["onLoadPlayback"];
  /** Reloads the session so the prompt gets a fresh media link. */
  onRefreshPrompt: () => Promise<void>;
  onSubmit: () => void;
  onSkip: () => void;
  onSaveExit: () => void;
}

export function SessionTaskView(props: SessionTaskViewProps) {
  const { session, task, fixture, busy, notice, missing, value } = props;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const answerCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice) {
      showToast(notice, { tone: "error" });
    }
  }, [notice, showToast]);
  const unsupported = !isClientRuntimeSupported(task.rendererKey) || !fixture;
  // Read-aloud, written-text, blank and highlight renderers draw the passage themselves; showing it here too doubles it.
  const rendererShowsPrompt = Boolean(fixture?.text || fixture?.tokens);
  const promptText = fixture ? (rendererShowsPrompt ? "" : fixture.prompt) : t("ui.sessionUnsupported");

  const timing = task.timing;
  const isSpeaking = task.section === "SPEAKING";
  const hasSavedRecording = typeof value.mediaPublicId === "string" && value.mediaPublicId.length > 0;
  const timedFrame = shouldMountTimedFrame(session) && timing && fixture && !unsupported ? timing : null;

  const renderBody = (timed?: TimedRendererControl, locked = false, attempt = 0) => fixture ? (
    <TaskRenderer key={attempt} fixture={fixture} rendererKey={task.rendererKey} value={value}
      sessionPublicId={session.publicId} itemPublicId={task.publicId} timed={timed}
      onUploadRecording={props.onUploadRecording} onLoadPlayback={props.onLoadPlayback}
      disabled={busy || unsupported || locked} onChange={props.onChange} />
  ) : <div className="task-unsupported" role="status"><p>{t("ui.sessionUnsupported")}</p></div>;

  useEffect(() => {
    const target = missing === "answer" ? answerCardRef.current : null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [missing]);

  return (
    <section className="practice-session" data-testid="practice-session">
      <div className="session-progress-row">
        <button className="icon-button" type="button" aria-label={t("ui.sessionSaveExit")} onClick={props.onSaveExit}>×</button>
        <progress className="session-progress" max={100} value={progressFor(session)} aria-label={t("ui.sessionProgress")} />
        <ProgressRing label={t("ui.sessionProgress")} size="xs" value={currentTaskPosition(session)} max={session.totalItemCount} />
        <span className="session-counter">{currentTaskPosition(session)}/{session.totalItemCount}</span>
      </div>
      <div className="session-task-header">
        <div>
          <span className="eyebrow">{task.section}</span><h1>{task.displayName}</h1>
          <p>{fixture?.instruction ?? t("ui.sessionAnswerTaskBelow")}</p>
        </div>
      </div>
      <div ref={answerCardRef} className={`session-task-card${missing === "answer" ? " field-missing" : ""}`}>
        {promptText ? <p className="session-task-prompt">{promptText}</p> : null}
        {timedFrame && fixture ? (
          <TimedTaskFrame key={task.publicId} timing={timedFrame} isSpeaking={isSpeaking}
            hasPromptAudio={Boolean(fixture.audioUrl)} hasSavedRecording={isSpeaking && hasSavedRecording}
            onRefreshPrompt={props.onRefreshPrompt}>
            {({ timed, locked, attempt }) => renderBody(timed, locked, attempt)}
          </TimedTaskFrame>
        ) : renderBody()}
        {missing === "answer" ? <FieldWarning message={t("ui.sessionNoAnswer")} /> : null}
      </div>
      <div className="session-footer-actions">
        <button className="text-button" type="button" disabled={busy} onClick={props.onSaveExit}>{t("ui.sessionSaveExit")}</button>
        <div className="session-primary-actions">
          <button className="button button-muted" type="button" disabled={busy} onClick={props.onSkip}>{t("ui.sessionSkip")}</button>
          <button className="button button-primary" type="button" disabled={busy || unsupported} onClick={props.onSubmit}>{t("ui.sessionSubmit")}</button>
        </div>
      </div>
    </section>
  );
}

