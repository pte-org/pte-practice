"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { recordingIssue } from "../answer-checks";
import type { TaskRendererProps } from "./RendererTypes";
import { AudioWaveform } from "../media/AudioWaveform";
import { PromptAudioPlayer } from "../media/PromptAudioPlayer";
import { MAX_RECORDING_DURATION_SECONDS, RECORDING_TEXT } from "../media/constants";
import { RecorderError, startWavRecording, type WavRecorderHandle } from "../media/audio-recorder";
import { clampRecordingDuration, padLevels, WAVEFORM_BAR_COUNT } from "../media/waveform";
import { createOnceCommand } from "../timed/play-once";

// "review": an untimed recording that is very short or silent waits for the student to keep or redo it.
type RecordingState = "idle" | "recording" | "uploading" | "review" | "recorded" | "saveFailed" | "error";

interface PendingRecording {
  blob: Blob;
  durationSeconds: number;
}

const LEVEL_SCALE = 3;

/**
 * Records the spoken answer, shows its waveform, and lets the student replay it. Untimed, the student starts and
 * stops it and can record again; in a timed question the frame drives it through `timed` and there is no retake.
 */
export function SpeakingRecorder({
  fixture, value, disabled = false, onChange, onUploadRecording, onLoadPlayback, timed, onActivityChange,
  itemPublicId,
}: TaskRendererProps) {
  const { t, locale } = useTranslation();
  const [issue, setIssue] = useState<"short" | "silent" | null>(null);
  const maxLevel = useRef(0);
  const [state, setState] = useState<RecordingState>(hasRecording(value) ? "recorded" : "idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [liveLevels, setLiveLevels] = useState<number[]>([]);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [serverPlaybackUrl, setServerPlaybackUrl] = useState<string | null>(null);
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
    setIsPermissionDenied(false);
    setLiveLevels([]);
    setPeaks(null);
    setLocalUrl(null);
    setServerPlaybackUrl(null);
    setIssue(null);
  }

  useEffect(() => {
    if (localUrl || !onLoadPlayback || (state !== "recorded" && state !== "review")) return;
    let active = true;
    void onLoadPlayback()
      .then((url) => { if (active) setServerPlaybackUrl(url); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [localUrl, onLoadPlayback, state]);

  useEffect(() => () => {
    recorder.current?.cancel();
    recorder.current = null;
    pending.current = null;
  }, []);
  // The session page warns before leaving while a recording is being made or uploaded.
  useEffect(() => {
    onActivityChange?.(state === "recording" || state === "uploading");
  }, [onActivityChange, state]);
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let active = true;

    const check = () => {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          if (!active) return;
          if (permissionStatus.state === "denied") {
            setIsPermissionDenied(true);
          } else if (permissionStatus.state === "granted") {
            setIsPermissionDenied(false);
            setMessage(null);
          }
          permissionStatus.onchange = () => {
            if (!active) return;
            if (permissionStatus.state === "granted") {
              setIsPermissionDenied(false);
              setMessage(null);
            } else if (permissionStatus.state === "denied") {
              setIsPermissionDenied(true);
            }
          };
        })
        .catch(() => undefined);
    };

    check();
    window.addEventListener("focus", check);
    return () => {
      active = false;
      window.removeEventListener("focus", check);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setMessage(null);
    setLiveLevels([]);
    setIssue(null);
    setIsPermissionDenied(false);
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
      const isDenied = error instanceof RecorderError && error.code === "PERMISSION_DENIED";
      setIsPermissionDenied(isDenied);
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
    setIsPermissionDenied(false);
    setPeaks(null);
    setLocalUrl(null);
    setServerPlaybackUrl(null);
    setLiveLevels([]);
    pending.current = null;
    setIssue(null);
    setState("idle");
  }

  const shownDuration = state === "recording" ? elapsedSeconds : durationFromValue(value, elapsedSeconds);
  const audioUrl = localUrl ?? serverPlaybackUrl;

  return (
    <div className="task-recording-panel">
      {fixture.text ? <p className="task-source-text">{fixture.text}</p> : null}
      <div className={`record-card${state === "recording" ? " record-card-recording" : ""}`}>
        <div className="record-card-header">
          <div className="record-card-title-group">
            <span className={`record-card-icon${state === "recording" ? " record-card-icon-recording" : ""}`} aria-hidden="true">
              <AppIcon name="mic" size={18} />
            </span>
            <strong className="record-card-title">{t("session.recordedAnswer")}</strong>
          </div>
          <div className="record-card-meta">
            <span className={`recording-status-badge recording-status-${state}`}>
              <span className="recording-status-dot" aria-hidden="true" />
              {statusText(state)}
            </span>
            <span className="task-recording-duration">{formatDuration(shownDuration)} / {formatDuration(maxSeconds)}</span>
          </div>
        </div>

        {state === "recording" ? (
          <div className="recording-live-wave">
            <AudioWaveform peaks={padLevels(liveLevels)} label={RECORDING_TEXT.waveform} />
          </div>
        ) : null}

        {state === "recorded" ? (
          audioUrl ? (
            <PromptAudioPlayer url={audioUrl} peaks={peaks} label={t("session.recordedAnswer")} interactive={!disabled} />
          ) : (
            <div className="recording-loading-strip">
              <span className="loading-dot" /> <span>{t("ui.sessionLoading")}</span>
            </div>
          )
        ) : null}

        {state === "review" ? (
          <>
            {issue ? (
              <p className="task-recording-message" role="alert">{t(`session.recording_${issue}` as TranslationKey)}</p>
            ) : null}
            {audioUrl ? (
              <PromptAudioPlayer url={audioUrl} peaks={peaks} label={t("session.recordedAnswer")} interactive={!disabled} />
            ) : null}
          </>
        ) : null}

        {isPermissionDenied ? (
          <div className="mic-denied-box" role="alert">
            <div className="mic-denied-box-header">
              <span className="mic-denied-icon" aria-hidden="true"><AppIcon name="lock" size={18} /></span><span className="mic-denied-badge">{t("deviceCheck.micDenied")}</span>
            </div>
            <div className="mic-denied-steps">
              <div className="mic-step-item">
                <span className="mic-step-num">1</span>
                <span>{t("deviceCheck.micStep1")}</span>
              </div>
              <div className="mic-step-item">
                <span className="mic-step-num">2</span>
                <span>{t("deviceCheck.micStep2")}</span>
              </div>
            </div>
          </div>
        ) : null}

        {message ? <p className="task-recording-message" role="alert">{message}</p> : null}

        <div className="task-recording-actions">
          {state === "recording" ? (
            timed ? null : (
              <button className="button button-danger button-pill" type="button" disabled={disabled} onClick={() => void stopRecording()}>
                <AppIcon name="stop" size={18} /> {RECORDING_TEXT.stop}
              </button>
            )
          ) : state === "uploading" ? (
            <div className="recording-loading-strip">
              <span className="loading-dot" /> <span>{RECORDING_TEXT.uploading}...</span>
            </div>
          ) : state === "review" ? (
            <>
              <button className="button button-outline-danger button-pill" type="button" disabled={disabled} onClick={recordAgain}>
                <AppIcon name="retake" size={18} /> {RECORDING_TEXT.recordAgain}
              </button>
              <button className="button button-outline button-pill" type="button" disabled={disabled}
                onClick={() => { if (pending.current) void saveRecording(pending.current); }}>
                {t("session.keepRecording")}
              </button>
            </>
          ) : state === "saveFailed" ? (
            <button className="button button-outline button-pill" type="button" disabled={disabled}
              onClick={() => { if (pending.current) void saveRecording(pending.current); }}>
              {RECORDING_TEXT.retrySave}
            </button>
          ) : state === "recorded" ? (
            timed ? null : (
              <button className="button button-outline-danger button-pill" type="button" disabled={disabled} onClick={recordAgain}>
                <AppIcon name="retake" size={18} /> {RECORDING_TEXT.recordAgain}
              </button>
            )
          ) : timed ? null : (
            <button className="button button-outline button-pill" type="button" disabled={disabled} onClick={() => void startRecording()}>
              <AppIcon name={isPermissionDenied ? "mic" : "record"} size={18} />{" "}
              {isPermissionDenied
                ? t("deviceCheck.grantPermission")
                : state === "error"
                ? RECORDING_TEXT.retry
                : RECORDING_TEXT.start}
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
