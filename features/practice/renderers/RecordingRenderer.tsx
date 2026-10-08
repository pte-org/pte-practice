"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskRendererProps } from "./RendererTypes";
import { MAX_RECORDING_DURATION_SECONDS, RECORDING_TEXT } from "../media/constants";
import { RecorderError, startWavRecording, type WavRecorderHandle } from "../media/audio-recorder";

type RecordingState = "idle" | "recording" | "uploading" | "recorded" | "error";

export function RecordingRenderer({ fixture, value, disabled = false, onChange, onUploadRecording }: TaskRendererProps) {
  const [state, setState] = useState<RecordingState>(hasRecording(value) ? "recorded" : "idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const recorder = useRef<WavRecorderHandle | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => () => recorder.current?.cancel(), []);

  async function startRecording() {
    setMessage(null);
    try {
      recorder.current = await startWavRecording();
      startedAt.current = Date.now();
      setElapsedSeconds(0);
      setState("recording");
    } catch (error) {
      setState("error");
      setMessage(recordingErrorMessage(error));
    }
  }

  const stopRecording = useCallback(async () => {
    const activeRecorder = recorder.current;
    if (!activeRecorder || state !== "recording") return;
    const durationSeconds = Math.max(1, Math.min(MAX_RECORDING_DURATION_SECONDS,
      Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000)));
    setState("uploading");
    setMessage(null);
    try {
      const blob = await activeRecorder.stop();
      recorder.current = null;
      if (!onUploadRecording) throw new RecorderError("FAILED");
      const media = await onUploadRecording(blob, durationSeconds);
      onChange({
        mediaPublicId: media.mediaPublicId,
        durationSeconds: media.durationSeconds,
      });
      setElapsedSeconds(media.durationSeconds);
      setState("recorded");
    } catch (error) {
      recorder.current = null;
      setState("error");
      setMessage(recordingErrorMessage(error));
    }
  }, [onChange, onUploadRecording, state]);

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => {
      const started = startedAt.current ?? Date.now();
      const seconds = Math.floor((Date.now() - started) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= MAX_RECORDING_DURATION_SECONDS) void stopRecording();
    }, 250);
    return () => window.clearInterval(timer);
  }, [state, stopRecording]);

  function clearRecording() {
    if (disabled || state === "recording" || state === "uploading") return;
    onChange({});
    setElapsedSeconds(0);
    setMessage(null);
    setState("idle");
  }

  return (
    <div className="task-recording-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <div className="task-recording-status" role="status" aria-live="polite">
        <span className={`recording-indicator recording-indicator-${state}`} aria-hidden="true" />
        <span>{state === "recording" ? RECORDING_TEXT.recording
          : state === "uploading" ? RECORDING_TEXT.uploading
            : state === "recorded" ? RECORDING_TEXT.recorded : RECORDING_TEXT.noRecording}</span>
        <span className="task-recording-duration">{RECORDING_TEXT.duration}: {formatDuration(state === "recording" ? elapsedSeconds : durationFromValue(value, elapsedSeconds))}</span>
      </div>
      {message ? <p className="task-recording-message" role="alert">{message}</p> : null}
      <div className="task-recording-actions">
        {state === "recording" ? (
          <button className="button button-primary" type="button" disabled={disabled} onClick={() => void stopRecording()}>
            {RECORDING_TEXT.stop}
          </button>
        ) : state === "uploading" ? (
          <button className="button button-muted" type="button" disabled>{RECORDING_TEXT.uploading}</button>
        ) : state === "recorded" ? (
          <>
            <button className="button button-muted" type="button" disabled={disabled} onClick={clearRecording}>{RECORDING_TEXT.retry}</button>
            <span className="task-recording-ready">{RECORDING_TEXT.microphoneReady}</span>
          </>
        ) : (
          <button className="button button-primary" type="button" disabled={disabled} onClick={() => void startRecording()}>
            {state === "error" ? RECORDING_TEXT.retry : RECORDING_TEXT.start}
          </button>
        )}
      </div>
    </div>
  );
}

function hasRecording(value: Record<string, unknown>): boolean {
  return typeof value.mediaPublicId === "string" && value.mediaPublicId.length > 0;
}

function durationFromValue(value: Record<string, unknown>, fallback: number): number {
  return typeof value.durationSeconds === "number" && Number.isFinite(value.durationSeconds)
    ? value.durationSeconds : fallback;
}

function formatDuration(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function recordingErrorMessage(error: unknown): string {
  if (error instanceof RecorderError) {
    if (error.code === "PERMISSION_DENIED") return RECORDING_TEXT.microphoneDenied;
    if (error.code === "NO_DEVICE") return RECORDING_TEXT.microphoneMissing;
    if (error.code === "BUSY") return RECORDING_TEXT.microphoneBusy;
    if (error.code === "UNSUPPORTED") return RECORDING_TEXT.microphoneUnsupported;
  }
  if (error instanceof Error && error.message) return error.message;
  return RECORDING_TEXT.uploadFailed;
}
