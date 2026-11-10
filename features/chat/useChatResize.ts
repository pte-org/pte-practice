"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { resizeChatBounds, type ChatPosition, type ChatSize } from "./chat-position";
import { CHAT_PANEL_MOVE_FAST_STEP, CHAT_PANEL_MOVE_STEP } from "./constants";

interface ResizeOrigin {
  pointerId: number;
  x: number;
  y: number;
  anchor: ChatPosition;
  size: ChatSize;
}
interface ChatResizeHandlers {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

/** Resize updates CSS variables only, so typing, recording and chat history keep their current state. */
export function useChatResize(panelRef: RefObject<HTMLElement | null>, open: boolean): ChatResizeHandlers {
  const origin = useRef<ResizeOrigin | null>(null);
  useEffect(() => {
    if (!open) {
      origin.current = null;
      panelRef.current?.removeAttribute("data-resizing");
    }
  }, [open, panelRef]);

  const apply = (requested: ChatSize, anchor: ChatPosition) => {
    const panel = panelRef.current;
    if (!panel) return;
    const bounds = resizeChatBounds(requested, anchor, { width: window.innerWidth, height: window.innerHeight });
    panel.style.setProperty("--chat-left", `${bounds.position.left}px`);
    panel.style.setProperty("--chat-top", `${bounds.position.top}px`);
    panel.style.setProperty("--chat-width", `${bounds.size.width}px`);
    panel.style.setProperty("--chat-height", `${bounds.size.height}px`);
    panel.dataset.positioned = "true";
    panel.dataset.resized = "true";
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    if (origin.current?.pointerId !== event.pointerId) return;
    origin.current = null;
    panelRef.current?.removeAttribute("data-resizing");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      origin.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        anchor: { left: rect.left, top: rect.top }, size: { width: rect.width, height: rect.height } };
      apply(rect, origin.current.anchor);
      panelRef.current?.setAttribute("data-resizing", "true");
    },
    onPointerMove(event) {
      const start = origin.current;
      if (!start || start.pointerId !== event.pointerId) return;
      if (event.buttons === 0) { finish(event); return; }
      apply({ width: start.size.width + event.clientX - start.x,
        height: start.size.height + event.clientY - start.y }, start.anchor);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
    onKeyDown(event) {
      const step = event.shiftKey ? CHAT_PANEL_MOVE_FAST_STEP : CHAT_PANEL_MOVE_STEP;
      const delta: Partial<Record<string, [number, number]>> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const movement = delta[event.key];
      const rect = panelRef.current?.getBoundingClientRect();
      if (!movement || !rect) return;
      event.preventDefault();
      apply({ width: rect.width + movement[0], height: rect.height + movement[1] }, { left: rect.left, top: rect.top });
    },
  };
}
