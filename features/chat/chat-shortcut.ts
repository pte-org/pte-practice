/** Shown on the toggle button; the same key opens and closes the panel. */
export const CHAT_SHORTCUT_LABEL = "Ctrl+/";
export const CHAT_SHORTCUT_ARIA = "Control+/";

interface ShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  isComposing: boolean;
}

export function isChatToggleShortcut(event: ShortcutEvent): boolean {
  if (event.isComposing || event.altKey || event.shiftKey) return false;
  return event.key === "/" && (event.ctrlKey || event.metaKey);
}
