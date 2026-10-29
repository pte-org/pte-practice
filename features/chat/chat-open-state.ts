import { CHAT_OPEN_STORAGE_KEY } from "./constants";

export interface ChatStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const OPEN = "1";
const CLOSED = "0";

/** Per-tab convenience only: storage may be blocked or empty, and then the panel simply starts closed. */
export function readChatOpen(storage: ChatStorage | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(CHAT_OPEN_STORAGE_KEY) === OPEN;
  } catch {
    return false;
  }
}

export function writeChatOpen(storage: ChatStorage | null, open: boolean): void {
  if (!storage) return;
  try {
    storage.setItem(CHAT_OPEN_STORAGE_KEY, open ? OPEN : CLOSED);
  } catch {
    // Not remembering the panel is harmless.
  }
}

export function chatSessionStorage(): ChatStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}
