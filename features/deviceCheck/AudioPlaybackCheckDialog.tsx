"use client";

import { useState } from "react";
import { AppIcon, CollapsibleSection, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { AudioWaveform } from "@/features/practice/media/AudioWaveform";
import { fallbackPeaks } from "@/features/practice/media/prompt-peaks";

const SAMPLE_PEAKS = fallbackPeaks("audio-playback-check", 40);

interface AudioPlaybackCheckDialogProps {
  open: boolean;
  /** The student confirmed they can hear audio. */
  onConfirm: () => void;
}

/**
 * "Check audio playback" each time a session with listening or speaking audio starts or resumes, as in the Pearson
 * practice session. It is not skippable for good: headphones get unplugged between visits.
 */
export function AudioPlaybackCheckDialog({ open, onConfirm }: AudioPlaybackCheckDialogProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const sentence = t("session.audioCheckSentence");

  const play = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-GB";
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const confirm = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    onConfirm();
  };

  return (
    <Modal open={open} onClose={confirm} title={t("session.audioCheckTitle")} titleIcon={<AppIcon name="listening" size={22} />}
      closeLabel={t("session.audioCheckConfirm")} isDismissDisabled
      footer={<button className="button button-primary button-pill" type="button" onClick={confirm}>{t("session.audioCheckConfirm")}</button>}>
      <div className="audio-check">
        <p>{t("session.audioCheckIntro")}</p>
        <div className="prompt-player">
          <button className="prompt-player-button" type="button" onClick={play} aria-label={t("deviceCheck.speakerPlay")}>
            <AppIcon name={playing ? "pause" : "play"} size={22} />
          </button>
          <div className="prompt-player-wave"><AudioWaveform peaks={SAMPLE_PEAKS} progress={0} label={sentence} /></div>
        </div>
        <p>{t("session.audioCheckYouWillHear")} <strong><em>{sentence}</em></strong></p>
        <CollapsibleSection title={t("session.audioCheckTroubleshoot")} defaultExpanded={false} className="audio-check-help"
          icon={<AppIcon name="info" size={18} />}>
          <p>{t("session.audioCheckTips")}</p>
        </CollapsibleSection>
      </div>
    </Modal>
  );
}
