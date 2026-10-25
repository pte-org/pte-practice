"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { recordingIssue } from "../answer-checks";
import type { TaskRendererProps } from "./RendererTypes";
import { AudioWaveform } from "../media/AudioWaveform";
import { MAX_RECORDING_DURATION_SECONDS, RECORDING_TEXT } from "../media/constants";
import { RecorderError, startWavRecording, type WavRecorderHandle } from "../media/audio-recorder";
import { useRecordingPlayback } from "../media/useRecordingPlayback";
import { clampRecordingDuration, padLevels, WAVEFORM_BAR_COUNT } from "../media/waveform";
import { createOnceCommand } from "../timed/play-once";

// "review": an untimed recording that is very short or silent waits for the student to keep or redo it.
type RecordingState = "idle" | "recording" | "uploading" | "review" | "recorded" | "saveFailed" | "error";

interface PendingRecording {
  blob: Blob;
  durationSeconds: number;
}

const LEVEL_SCALE = 3;
const FLAT_PEAKS: readonly number[] = new Array<number>(WAVEFORM_BAR_COUNT).fill(0.15);

/**
 * Records the spoken answer, shows its waveform, and lets the student replay it. Untimed, the student starts and
 * stops it and can record again; in a timed question the frame drives it through `timed` and there is no retake.
 */
export function SpeakingRecorder({
  fixture, value, disabled = false, onChange, onUploadRecording, onLoadPlayback, timed, onActivityChange,
  itemPublicId,
}: TaskRendererProps) {
  const { t } = useTranslation();
  const [issue, setIssue] = useState<"short" | "silent" | null>(null);
  const maxLevel = useRef(0);
  const [state, setState] = useState<RecordingState>(hasRecording(value) ? "recorded" : "idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [liveLevels, setLiveLevels] = useState<number[]>([]);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const recorder = useRef<WavRecorderHandle | null>(null);
  const startedAt = useRef<number | null>(null);
  const pending = useRef<PendingRecording | null>(null);
  const autoStart = useRef(createOnceCommand());
  const maxSeconds = timed?.maxSeconds ?? MAX_RECORDING_DURATION_SECONDS;

  const [prevItemId, setPrevItemId] = useState(itemPublicId);
  if (prevItemId !== itemPublicId) {
    setPrevItemId(itemPublicId);
    setState(hasRecording(value) ? "recorded" : "idle");
    setElapsedSeconds(durationFromValue(value, 0));
    setMessage(null);
    setLiveLevels([]);
    setPeaks(null);
    setLocalUrl(null);
    setIssue(null);
  }

  const playbackFailed = useCallback(() => setMessage(RECORDING_TEXT.playbackFailed), []);
  const playback = useRecordingPlayback(localUrl, onLoadPlayback ?? null, playbackFailed);

  useEffect(() => () => {
    recorder.current?.cancel();
    recorder.current = null;
    pending.current = null;
  }, [itemPublicId]);
  // The session page warns before leaving while a recording is being made or uploaded.
  useEffect(() => {
    onActivityChange?.(state === "recording" || state === "uploading");
  }, [onActivityChange, state]);
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);

  const startRecording = useCallback(async () => {
    setMessage(null);
    setLiveLevels([]);
    setIssue(null);
    maxLevel.current = 0;
    try {
      recorder.current = await startWavRecording({
        onLevel: (level) => {
          maxLevel.current = Math.max(maxLevel.current, level);
          setLiveLevels((previous) => [...previous, Math.min(1, level * LEVEL_SCALE)].slice(-WAVEFORM_BAR_COUNT));
        },
      });
      startedAt.current = Date.now();
      setElapsedSeconds(0);
      setState("recording");
      timed?.onRecordStarted();
    } catch (error) {
      setState("error");
      setMessage(recordingErrorMessage(error));
      timed?.onMicError();
    }
  }, [timed]);

  /** Uploads the recording and tells the session; a failure keeps the recording so only the save is retried. */
  const saveRecording = useCallback(async (recording: PendingRecording) => {
    setState("uploading");
    setMessage(null);
    try {
      if (!onUploadRecording) throw new RecorderError("FAILED");
      const media = await onUploadRecording(recording.blob, recording.durationSeconds);
      pending.current = null;
      onChange({ mediaPublicId: media.mediaPublicId, durationSeconds: media.durationSeconds });
      setElapsedSeconds(media.durationSeconds);
      setState("recorded");
      timed?.onSaved();
    } catch (error) {
      setState("saveFailed");
      setMessage(recordingErrorMessage(error));
      timed?.onSaveFailed();
    }
  }, [onChange, onUploadRecording, timed]);

  const stopRecording = useCallback(async () => {
    const active = recorder.current;
    if (!active || state !== "recording") return;
    setState("uploading");
    const recording = await active.stop();
    recorder.current = null;
    pending.current = {
      blob: recording.blob,
      durationSeconds: clampRecordingDuration(recording.durationSeconds, maxSeconds),
    };
    setPeaks(recording.peaks);
    setLocalUrl(URL.createObjectURL(recording.blob));
    // Untimed only: a timed question must save whatever was recorded, its rhythm does not wait.
    const found = timed ? null : recordingIssue(pending.current.durationSeconds, maxLevel.current);
    if (found) {
      setIssue(found);
      setState("review");
      return;
    }
    await saveRecording(pending.current);
  }, [maxSeconds, saveRecording, state, timed]);

  // The frame decides when to record: "start" opens the microphone once per run, "stop" ends and saves it.
  const command = timed?.recordCommand ?? null;
  useEffect(() => {
    if (command === null) { autoStart.current.reset(); return; }
    if (command === "start" && autoStart.current.fire()) void startRecording();
    if (command === "stop") void stopRecording();
  }, [command, startRecording, stopRecording]);

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= maxSeconds && !timed) void stopRecording();
    }, 250);
    return () => window.clearInterval(timer);
  }, [maxSeconds, state, stopRecording, timed]);

  function recordAgain() {
    if (disabled || timed || state === "recording" || state === "uploading") return;
    onChange({});
    setElapsedSeconds(0);
    setMessage(null);
    setPeaks(null);
    setLocalUrl(null);
    setLiveLevels([]);
    pending.current = null;
    setIssue(null);
    setState("idle");
  }

  const shownDuration = state === "recording" ? elapsedSeconds : durationFromValue(value, elapsedSeconds);
  const recorded = state === "recorded";
  const waveform = state === "recording" ? padLevels(liveLevels) : peaks ?? FLAT_PEAKS;
  const showWaveform = state === "recording" || state === "uploading" || state === "review" || state === "saveFailed" || recorded;

  return (
    <div className="task-recording-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <div className="record-card">
      <strong className="record-card-title">{t("session.recordedAnswer")}</strong>
      <div className="task-recording-status" role="status" aria-live="polite">
        <span className={`recording-indicator recording-indicator-${state}`} aria-hidden="true" />
        <span>{statusText(state)}</span>
        <span className="task-recording-duration">{formatDuration(shownDuration)} / {formatDuration(maxSeconds)}</span>
      </div>
      {showWaveform ? (
        <div className="recording-waveform">
          <AudioWaveform peaks={waveform} label={RECORDING_TEXT.waveform}
            progress={recorded ? playback.progress : 0}
            onSeek={recorded && !disabled ? playback.seek : undefined} />
        </div>
      ) : null}
      {message ? <p className="task-recording-message" role="alert">{message}</p> : null}
      {state === "review" && issue ? (
        <p className="task-recording-message" role="alert">{t(`session.recording_${issue}` as TranslationKey)}</p>
      ) : null}
      <div className="task-recording-actions">
        {state === "recording" ? (
          // A timed question stops through the frame's "stop early" button, so the recorder has no stop of its own.
          timed ? null : (
            <button className="button button-primary" type="button" disabled={disabled} onClick={() => void stopRecording()}>
              <AppIcon name="stop" size={18} /> {RECORDING_TEXT.stop}
            </button>
          )
        ) : state === "uploading" ? (
          <button className="button button-muted" type="button" disabled>{RECORDING_TEXT.uploading}</button>
        ) : state === "review" ? (
          <>
            <button className="button button-muted" type="button" disabled={disabled} onClick={recordAgain}>
              <AppIcon name="retake" size={18} /> {RECORDING_TEXT.recordAgain}
            </button>
            <button className="button button-primary" type="button" disabled={disabled}
              onClick={() => { if (pending.current) void saveRecording(pending.current); }}>
              {t("session.keepRecording")}
            </button>
          </>
        ) : state === "saveFailed" ? (
          <button className="button button-primary" type="button" disabled={disabled}
            onClick={() => { if (pending.current) void saveRecording(pending.current); }}>
            {RECORDING_TEXT.retrySave}
          </button>
        ) : recorded ? (
          <>
            <button className="button button-primary" type="button" disabled={disabled} onClick={playback.toggle}>
              <AppIcon name={playback.playing ? "pause" : "play"} size={18} /> {playback.playing ? RECORDING_TEXT.pause : RECORDING_TEXT.play}
            </button>
            {timed ? null : (
              <button className="button button-muted" type="button" disabled={disabled} onClick={recordAgain}>
                <AppIcon name="retake" size={18} /> {RECORDING_TEXT.recordAgain}
              </button>
            )}
          </>
        ) : timed ? null : (
          <button className="button button-primary" type="button" disabled={disabled} onClick={() => void startRecording()}>
            <AppIcon name="record" size={18} /> {state === "error" ? RECORDING_TEXT.retry : RECORDING_TEXT.start}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}

function statusText(state: RecordingState): string {
  if (state === "review") return RECORDING_TEXT.recorded;
  if (state === "recording") return RECORDING_TEXT.recording;
  if (state === "uploading") return RECORDING_TEXT.uploading;
  if (state === "recorded") return RECORDING_TEXT.recorded;
  if (state === "saveFailed") return RECORDING_TEXT.saveFailed;
  return RECORDING_TEXT.noRecording;
}

function hasRecording(value: Record<string, unknown>): boolean {
  return typeof value.mediaPublicId === "string" && value.mediaPublicId.length > 0;
}

function durationFromValue(value: Record<string, unknown>, fallback: number): number {
  return typeof value.durationSeconds === "number" && Number.isFinite(value.durationSeconds)
    ? value.durationSeconds : fallback;
}

function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
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
