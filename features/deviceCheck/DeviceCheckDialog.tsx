"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon, Modal } from "@/common/components";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { AudioWaveform } from "@/features/practice/media/AudioWaveform";
import { PromptAudioPlayer } from "@/features/practice/media/PromptAudioPlayer";
import { RecorderError, startWavRecording, type WavRecorderHandle } from "@/features/practice/media/audio-recorder";
import { padLevels, WAVEFORM_BAR_COUNT } from "@/features/practice/media/waveform";
import {
  hasVietnameseInput, micVerdict, READING_SIZES, readReadingSize, wordsPerMinute, writeReadingSize,
  type DeviceCheckKind, type MicVerdict, type ReadingSize,
} from "./device-check";

const TEST_SECONDS = 5;
const SAMPLE_SENTENCE = "The library will open early on Monday for maintenance.";
const READING_SAMPLE = "Remote work has changed how companies hire, because teams can now include people from many different countries.";
const TITLES: Record<DeviceCheckKind, "deviceCheck.micTitle" | "deviceCheck.speakerTitle" | "deviceCheck.keyboardTitle" | "deviceCheck.readingTitle"> = {
  mic: "deviceCheck.micTitle",
  speaker: "deviceCheck.speakerTitle",
  keyboard: "deviceCheck.keyboardTitle",
  reading: "deviceCheck.readingTitle",
};

interface DeviceCheckDialogProps {
  kind: DeviceCheckKind | null;
  onClose: () => void;
  /** The student confirmed the device works; the tile shows it as checked. */
  onPassed: (kind: DeviceCheckKind) => void;
  /** The check failed (e.g. permission blocked, silence, or hardware error); the tile shows it as failed. */
  onFailed?: (kind: DeviceCheckKind) => void;
}

/** One device check in a dialog. Nothing is uploaded: the test recording stays in this browser tab. */
export function DeviceCheckDialog({ kind, onClose, onPassed, onFailed }: DeviceCheckDialogProps) {
  const { t } = useTranslation();
  if (!kind) return null;
  const pass = () => { onPassed(kind); onClose(); };
  const fail = () => { onFailed?.(kind); };
  return (
    <Modal open onClose={onClose} title={t(TITLES[kind])} titleIcon={<AppIcon name="info" size={22} />} closeLabel={t("mode.close")}>
      {kind === "mic" ? <MicCheck onPass={pass} onFail={fail} /> : null}
      {kind === "speaker" ? <SpeakerCheck onPass={pass} onFail={fail} /> : null}
      {kind === "keyboard" ? <KeyboardCheck onPass={pass} /> : null}
      {kind === "reading" ? <ReadingCheck onPass={pass} /> : null}
    </Modal>
  );
}

function MicCheck({ onPass, onFail }: { onPass: () => void; onFail?: () => void }) {
  const { t, locale } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "recording" | "done" | "error">("idle");
  const [levels, setLevels] = useState<number[]>([]);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [verdict, setVerdict] = useState<MicVerdict | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const recorder = useRef<WavRecorderHandle | null>(null);
  const maxLevel = useRef(0);

  useEffect(() => () => { recorder.current?.cancel(); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

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
            setError(t("deviceCheck.micDenied"));
            onFail?.();
          } else if (permissionStatus.state === "granted") {
            setIsPermissionDenied(false);
            setError(null);
          }
          permissionStatus.onchange = () => {
            if (!active) return;
            if (permissionStatus.state === "granted") {
              setIsPermissionDenied(false);
              setError(null);
            } else if (permissionStatus.state === "denied") {
              setIsPermissionDenied(true);
              setError(t("deviceCheck.micDenied"));
              onFail?.();
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
  }, [onFail, t]);

  const record = async () => {
    setError(null);
    setLevels([]);
    maxLevel.current = 0;
    try {
      recorder.current = await startWavRecording({
        onLevel: (level) => {
          maxLevel.current = Math.max(maxLevel.current, level);
          setLevels((previous) => [...previous, Math.min(1, level * 3)].slice(-WAVEFORM_BAR_COUNT));
        },
      });
      setIsPermissionDenied(false);
      setPhase("recording");
      window.setTimeout(async () => {
        const active = recorder.current;
        if (!active) return;
        recorder.current = null;
        const recording = await active.stop();
        setPeaks(recording.peaks);
        setUrl(URL.createObjectURL(recording.blob));
        const v = micVerdict(maxLevel.current);
        setVerdict(v);
        if (v === "silent") {
          onFail?.();
        }
        setPhase("done");
      }, TEST_SECONDS * 1000);
    } catch (reason) {
      setPhase("error");
      const isDenied = reason instanceof RecorderError && reason.code === "PERMISSION_DENIED";
      setIsPermissionDenied(isDenied);
      setError(isDenied ? t("deviceCheck.micDenied") : t("deviceCheck.micFailed"));
      onFail?.();
    }
  };

  return (
    <div className="device-check">
      <p>{t("deviceCheck.micIntro")}</p>
      {phase === "recording" ? (
        <div className="recording-waveform">
          <AudioWaveform peaks={padLevels(levels)} label={t("deviceCheck.micTitle")} />
        </div>
      ) : null}
      {phase === "recording" ? <p role="status">{t("deviceCheck.micRecording")}</p> : null}
      {phase === "done" && verdict ? <p role="status" className={`device-verdict device-verdict-${verdict}`}>{t(`deviceCheck.mic_${verdict}` as TranslationKey)}</p> : null}
      {isPermissionDenied ? (
        <div className="mic-denied-box" role="alert">
          <div className="mic-denied-box-header">
            <span className="mic-denied-badge">🔒 {t("deviceCheck.micDenied")}</span>
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
      ) : error ? (
        <p role="alert" className="device-verdict device-verdict-silent">{error}</p>
      ) : null}
      {phase === "done" && url ? (
        <div className="mic-check-player">
          <PromptAudioPlayer url={url} label={t("deviceCheck.micTitle")} peaks={peaks} interactive autoPlay />
        </div>
      ) : null}
      <div className="device-actions">
        <button
          className="button button-pill button-outline"
          type="button"
          disabled={phase === "recording"}
          onClick={() => void record()}
        >
          <AppIcon name={isPermissionDenied ? "mic" : "record"} size={16} />{" "}
          {isPermissionDenied
            ? t("deviceCheck.grantPermission")
            : phase === "idle"
            ? t("deviceCheck.micStart")
            : t("deviceCheck.again")}
        </button>
        <button className="button button-outline button-pill" type="button" disabled={phase !== "done"} onClick={onPass}>
          {t("deviceCheck.works")}
        </button>
      </div>
    </div>
  );
}

function SpeakerCheck({ onPass, onFail }: { onPass: () => void; onFail?: () => void }) {
  const { t } = useTranslation();
  const [cantHear, setCantHear] = useState(false);

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("This is a sound check. If you can hear this clearly, you are ready.");
    utterance.lang = "en-GB";
    window.speechSynthesis.speak(utterance);
  };

  /** A short tone in one ear, to check the headphones are the right way round. */
  const tone = (pan: -1 | 1) => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const panner = context.createStereoPanner();
    const gain = context.createGain();
    oscillator.frequency.value = 660;
    panner.pan.value = pan;
    gain.gain.value = 0.2;
    oscillator.connect(gain).connect(panner).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);
    oscillator.onended = () => void context.close();
  };

  return (
    <div className="device-check">
      <p>{t("deviceCheck.speakerIntro")}</p>
      <div className="device-actions device-actions-start">
        <button className="button button-pill button-outline" type="button" onClick={speak}><AppIcon name="play" size={16} /> {t("deviceCheck.speakerPlay")}</button>
        <button className="button button-pill button-outline" type="button" onClick={() => tone(-1)}>{t("deviceCheck.speakerLeft")}</button>
        <button className="button button-pill button-outline" type="button" onClick={() => tone(1)}>{t("deviceCheck.speakerRight")}</button>
      </div>
      {cantHear ? <p role="status" className="device-verdict device-verdict-quiet">{t("deviceCheck.speakerTips")}</p> : null}
      <div className="device-actions">
        <button className="button button-pill button-outline-danger" type="button" onClick={() => { setCantHear(true); onFail?.(); }}>{t("deviceCheck.speakerCantHear")}</button>
        <button className="button button-outline button-pill" type="button" onClick={onPass}>{t("deviceCheck.speakerHeard")}</button>
      </div>
    </div>
  );
}

function KeyboardCheck({ onPass }: { onPass: () => void }) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);
  const vietnamese = hasVietnameseInput(typed);
  const matches = typed.trim().toLowerCase() === SAMPLE_SENTENCE.toLowerCase();

  const change = (value: string) => {
    const now = Date.now();
    const start = startedAt ?? now;
    if (startedAt === null) setStartedAt(now);
    setTyped(value);
    if (value.trim().toLowerCase() === SAMPLE_SENTENCE.toLowerCase()) setWpm(wordsPerMinute(value.length, now - start));
  };

  return (
    <div className="device-check">
      <p>{t("deviceCheck.keyboardIntro")}</p>
      <p className="device-sample">{SAMPLE_SENTENCE}</p>
      <textarea className="device-input" rows={2} value={typed} spellCheck={false} autoComplete="off"
        aria-label={t("deviceCheck.keyboardTitle")} onChange={(event) => change(event.target.value)} />
      {vietnamese ? <p role="alert" className="device-verdict device-verdict-loud">{t("deviceCheck.keyboardVietnamese")}</p> : null}
      {matches && wpm !== null ? <p role="status" className="device-verdict device-verdict-good">{wpm} {t("deviceCheck.keyboardWpm")}</p> : null}
      <div className="device-actions">
        <button className="button button-pill button-outline" type="button" onClick={() => { setTyped(""); setStartedAt(null); setWpm(null); }}>{t("deviceCheck.again")}</button>
        <button className="button button-outline button-pill" type="button" disabled={!matches || vietnamese} onClick={onPass}>
          {t("deviceCheck.works")}
        </button>
      </div>
    </div>
  );
}

function ReadingCheck({ onPass }: { onPass: () => void }) {
  const { t } = useTranslation();
  const [size, setSize] = useState<ReadingSize>(readReadingSize);

  return (
    <div className="device-check">
      <p>{t("deviceCheck.readingIntro")}</p>
      <div className="mode-count" role="radiogroup" aria-label={t("deviceCheck.readingTitle")}>
        {READING_SIZES.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={size === option}
            className={`mode-count-chip${size === option ? " mode-count-chip-selected" : ""}`} onClick={() => setSize(option)}>
            {t(`deviceCheck.reading_${option}` as TranslationKey)}
          </button>
        ))}
      </div>
      <p className={`device-sample reading-size-${size}`}>{READING_SAMPLE}</p>
      <div className="device-actions">
        <button className="button button-outline button-pill" type="button" onClick={() => {
          writeReadingSize(size);
          document.documentElement.dataset.readingSize = size;
          onPass();
        }}>{t("deviceCheck.readingUse")}</button>
      </div>
    </div>
  );
}
