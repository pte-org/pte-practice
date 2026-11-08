import { ASSISTANT_NAME_CHANGE_EVENT, ASSISTANT_NAME_MAX_LENGTH, ASSISTANT_NAME_STORAGE_KEY } from "./constants";

/** Browser preferences are untrusted; an invalid value falls back to the localized default. */
export function normalizeAssistantName(value: string | null): string | null {
  if (!value || value.length > ASSISTANT_NAME_MAX_LENGTH * 4) return null;
  const name = value.replace(/\s+/gu, " ").trim();
  const letters = Array.from(name);
  if (!name || letters.length > ASSISTANT_NAME_MAX_LENGTH || /\p{Cc}/u.test(name)) return null;
  return name;
}

export function readAssistantName(): string | null {
  try { return normalizeAssistantName(window.localStorage.getItem(ASSISTANT_NAME_STORAGE_KEY)); }
  catch { return null; }
}

export function subscribeAssistantName(notify: () => void): () => void {
  const changed = (event: StorageEvent) => {
    if (event.key === ASSISTANT_NAME_STORAGE_KEY || event.key === null) notify();
  };
  window.addEventListener("storage", changed);
  window.addEventListener(ASSISTANT_NAME_CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", changed);
    window.removeEventListener(ASSISTANT_NAME_CHANGE_EVENT, notify);
  };
}

export function saveAssistantName(value: string): boolean {
  const name = normalizeAssistantName(value);
  if (!name) return false;
  try {
    window.localStorage.setItem(ASSISTANT_NAME_STORAGE_KEY, name);
    window.dispatchEvent(new Event(ASSISTANT_NAME_CHANGE_EVENT));
    return true;
  } catch { return false; }
}

export function resetAssistantName(): boolean {
  try {
    window.localStorage.removeItem(ASSISTANT_NAME_STORAGE_KEY);
    window.dispatchEvent(new Event(ASSISTANT_NAME_CHANGE_EVENT));
    return true;
  } catch { return false; }
}
