import { CHAT_PANEL_GUTTER, CHAT_PANEL_MIN_HEIGHT, CHAT_PANEL_MIN_WIDTH } from "./constants";

export interface ChatPosition { left: number; top: number }
export interface ChatSize { width: number; height: number }

/** Keep the whole panel reachable, including after a viewport becomes smaller. */
export function clampChatPosition(position: ChatPosition, panel: ChatSize, viewport: ChatSize): ChatPosition {
  return {
    left: Math.min(Math.max(CHAT_PANEL_GUTTER, position.left),
      Math.max(CHAT_PANEL_GUTTER, viewport.width - panel.width - CHAT_PANEL_GUTTER)),
    top: Math.min(Math.max(CHAT_PANEL_GUTTER, position.top),
      Math.max(CHAT_PANEL_GUTTER, viewport.height - panel.height - CHAT_PANEL_GUTTER)),
  };
}

export interface ChatPanelBounds { position: ChatPosition; size: ChatSize }

/** Resize from the bottom-right without moving the top-left unless the viewport has become too small. */
export function resizeChatBounds(requested: ChatSize, anchor: ChatPosition, viewport: ChatSize): ChatPanelBounds {
  const minimum = {
    width: Math.min(CHAT_PANEL_MIN_WIDTH, Math.max(1, viewport.width - CHAT_PANEL_GUTTER * 2)),
    height: Math.min(CHAT_PANEL_MIN_HEIGHT, Math.max(1, viewport.height - CHAT_PANEL_GUTTER * 2)),
  };
  const position = clampChatPosition(anchor, minimum, viewport);
  return { position, size: {
    width: Math.min(Math.max(minimum.width, requested.width), Math.max(minimum.width, viewport.width - position.left - CHAT_PANEL_GUTTER)),
    height: Math.min(Math.max(minimum.height, requested.height), Math.max(minimum.height, viewport.height - position.top - CHAT_PANEL_GUTTER)),
  } };
}
