"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { BACKGROUND_BLUR_OPTIONS, GLASS_OPACITY_OPTIONS } from "./constants";
import { BackgroundImageError, prepareBackground } from "./prepareBackground";
import { resetAppearance, saveAppearance } from "./preferences";
import type { PracticeAppearance } from "./types";

interface AppearanceSettingsProps { value: PracticeAppearance; onBusyChange?: (busy: boolean) => void }

export const AppearanceSettings = ({ value, onBusyChange }: AppearanceSettingsProps): ReactElement => {
  const { t } = useTranslation();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRequest = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => { imageRequest.current += 1; }, []);
  const update = (patch: Partial<PracticeAppearance>): void => {
    setError(saveAppearance({ ...value, ...patch }) ? null : t("appearance.storageError"));
  };
  const selectFile = async (file: File): Promise<void> => {
    const request = ++imageRequest.current;
    setBusy(true);
    onBusyChange?.(true);
    setError(null);
    try {
      const image = await prepareBackground(file);
      if (request !== imageRequest.current) return;
      update({ background: "custom", image, focus: false });
    } catch (reason) {
      if (request !== imageRequest.current) return;
      setError(reason instanceof BackgroundImageError && reason.issue === "type"
        ? t("appearance.typeError") : reason instanceof BackgroundImageError && reason.issue === "size"
          ? t("appearance.sizeError") : t("appearance.decodeError"));
    } finally {
      if (request === imageRequest.current) { setBusy(false); onBusyChange?.(false); }
    }
  };
  return (
    <section className="practice-appearance-control" aria-label={t("appearance.title")}>
        <p className="quiet-note">{t("appearance.localNotice")}</p>
        <fieldset disabled={busy} className="practice-appearance-fields">
          <legend>{t("appearance.background")}</legend>
          <div className="practice-background-choices">
            {(["default", "ocean", "forest", "dawn"] as const).map((background) => (
              <label className="practice-background-choice" key={background}>
                <input type="radio" name={`${id}-background`} checked={value.background === background}
                  onChange={() => update({ background, focus: false })} />
                <span className={`practice-background-swatch practice-background-${background}`} aria-hidden="true" />
                <span>{t(`appearance.${background}`)}</span>
              </label>
            ))}
            {value.image ? <label className="practice-background-choice">
              <input type="radio" name={`${id}-background`} checked={value.background === "custom"}
                onChange={() => update({ background: "custom", focus: false })} />
              <AppIcon name="describeImage" size={28} /><span>{t("appearance.custom")}</span>
            </label> : null}
            <button type="button" className="practice-background-choice practice-background-upload"
              title={t("appearance.upload")} aria-label={t("appearance.upload")}
              onClick={() => fileInput.current?.click()}>
              <span className="practice-background-swatch practice-background-upload-icon" aria-hidden="true">
                <AppIcon name="describeImage" size={24} />
              </span>
              <span>{t("appearance.chooseImage")}</span>
            </button>
          </div>
          <input ref={fileInput} hidden id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void selectFile(file);
          }} />
          <p className="quiet-note">{t("appearance.imageHelp")}</p>
          <label className="practice-appearance-range" htmlFor={`${id}-blur`}>
            <span>{t("appearance.blur")}</span><output>{value.blur}px</output>
            <input id={`${id}-blur`} type="range" min={0} max={3} step={1}
              aria-valuetext={`${value.blur}px`}
              value={BACKGROUND_BLUR_OPTIONS.indexOf(value.blur)}
              onChange={(event) => update({ blur: BACKGROUND_BLUR_OPTIONS[Number(event.target.value)] })} />
          </label>
          <label className="practice-appearance-range" htmlFor={`${id}-opacity`}>
            <span>{t("appearance.opacity")}</span><output>{value.opacity}%</output>
            <input id={`${id}-opacity`} type="range" min={0} max={2} step={1}
              aria-valuetext={`${value.opacity}%`}
              value={GLASS_OPACITY_OPTIONS.indexOf(value.opacity)}
              onChange={(event) => update({ opacity: GLASS_OPACITY_OPTIONS[Number(event.target.value)] })} />
          </label>
          <label className="practice-appearance-focus"><input type="checkbox" checked={value.focus}
            onChange={(event) => update({ focus: event.target.checked })} />{t("appearance.focus")}</label>
          <button type="button" className="text-button" onClick={() => setError(resetAppearance() ? null : t("appearance.storageError"))}>
            {t("appearance.reset")}
          </button>
        </fieldset>
        {busy ? <p role="status">{t("appearance.processing")}</p> : null}
        {error ? <p role="alert" className="practice-appearance-error">{error}</p> : null}
    </section>
  );
};
