import {
  APPEARANCE_CHANGE_EVENT, APPEARANCE_STORAGE_KEY, BACKGROUND_BLUR_OPTIONS, BACKGROUND_OPTIONS,
  GLASS_OPACITY_OPTIONS, MAX_BACKGROUND_DATA_LENGTH,
} from "./constants";
import type { PracticeAppearance } from "./types";

export const DEFAULT_APPEARANCE: PracticeAppearance = { background: "ocean", image: null, blur: 0, opacity: 80, focus: false };

export function parseAppearance(raw: string | null): PracticeAppearance {
  if (!raw || raw.length > MAX_BACKGROUND_DATA_LENGTH + 1024) return DEFAULT_APPEARANCE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return DEFAULT_APPEARANCE;
    // Untrusted browser storage is narrowed field by field before it reaches the UI.
    const record = value as Record<string, unknown>;
    const background = BACKGROUND_OPTIONS.find((item) => item === record.background) ?? DEFAULT_APPEARANCE.background;
    const image = typeof record.image === "string" && record.image.length <= MAX_BACKGROUND_DATA_LENGTH
      && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(record.image) ? record.image : null;
    return {
      background: background === "custom" && !image ? DEFAULT_APPEARANCE.background : background,
      image,
      blur: BACKGROUND_BLUR_OPTIONS.find((item) => item === record.blur) ?? DEFAULT_APPEARANCE.blur,
      opacity: GLASS_OPACITY_OPTIONS.find((item) => item === record.opacity) ?? DEFAULT_APPEARANCE.opacity,
      focus: record.focus === true,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function readAppearanceSnapshot(): string | null {
  try { return window.localStorage.getItem(APPEARANCE_STORAGE_KEY); } catch { return null; }
}

export function subscribeAppearance(notify: () => void): () => void {
  const changed = (event: StorageEvent) => {
    if (event.key === APPEARANCE_STORAGE_KEY || event.key === null) notify();
  };
  window.addEventListener("storage", changed);
  window.addEventListener(APPEARANCE_CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", changed);
    window.removeEventListener(APPEARANCE_CHANGE_EVENT, notify);
  };
}

export function saveAppearance(value: PracticeAppearance): boolean {
  try {
    const normalized = parseAppearance(JSON.stringify(value));
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
    return true;
  } catch { return false; }
}

export function resetAppearance(): boolean {
  try {
    window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
    return true;
  } catch { return false; }
}
