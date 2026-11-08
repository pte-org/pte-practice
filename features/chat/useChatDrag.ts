"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { clampChatPosition, type ChatPosition, type ChatSize } from "./chat-position";
import { CHAT_PANEL_MOVE_FAST_STEP, CHAT_PANEL_MOVE_STEP } from "./constants";

interface DragOrigin {
  pointerId: number;
  x: number;
  y: number;
  left: number;
  top: number;
  size: ChatSize;
}
export interface ChatDragHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onMoveKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/** Pointer capture keeps dragging reliable outside the header; movement never re-renders the conversation. */
export function useChatDrag(panelRef: RefObject<HTMLElement | null>, open: boolean): ChatDragHandlers {
  const origin = useRef<DragOrigin | null>(null);

  const place = useCallback((next: ChatPosition, size: ChatSize) => {
    const panel = panelRef.current;
    if (!panel) return;
    const bounded = clampChatPosition(next, size, { width: window.innerWidth, height: window.innerHeight });
    panel.style.setProperty("--chat-left", `${bounded.left}px`);
    panel.style.setProperty("--chat-top", `${bounded.top}px`);
    panel.dataset.positioned = "true";
  }, [panelRef]);

  useEffect(() => {
    if (!open) {
      origin.current = null;
      panelRef.current?.removeAttribute("data-dragging");
      return;
    }
    const panel = panelRef.current;
    const fit = () => {
      if (!panel || origin.current) return;
      const rect = panel.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      panel.closest<HTMLElement>(".chat-layout")?.style.setProperty("--chat-panel-height", `${rect.height}px`);
      const current = { left: rect.left, top: rect.top };
      const bounded = clampChatPosition(current, rect, { width: window.innerWidth, height: window.innerHeight });
      if (panel.dataset.positioned === "true" || bounded.left !== current.left || bounded.top !== current.top) {
        place(bounded, rect);
      }
    };
    fit();
    window.addEventListener("resize", fit);
    const observer = new ResizeObserver(fit);
    if (panel) observer.observe(panel);
    return () => { window.removeEventListener("resize", fit); observer.disconnect(); };
  }, [open, panelRef, place]);

  const finish = (event: PointerEvent<HTMLElement>) => {
    if (origin.current?.pointerId !== event.pointerId) return;
    origin.current = null;
    panelRef.current?.removeAttribute("data-dragging");
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) place({ left: rect.left, top: rect.top }, rect);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0 || !(event.target instanceof Element)
          || event.target.closest("button, a, input, textarea, select")) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      origin.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        left: rect.left, top: rect.top, size: { width: rect.width, height: rect.height } };
      panelRef.current?.setAttribute("data-dragging", "true");
    },
    onPointerMove(event) {
      const start = origin.current;
      if (!start || start.pointerId !== event.pointerId) return;
      // Recover if the pointer was released while the browser was out of focus.
      if (event.buttons === 0) { finish(event); return; }
      place({ left: start.left + event.clientX - start.x, top: start.top + event.clientY - start.y }, start.size);
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
    onMoveKeyDown(event) {
      const step = event.shiftKey ? CHAT_PANEL_MOVE_FAST_STEP : CHAT_PANEL_MOVE_STEP;
      const delta: Partial<Record<string, [number, number]>> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const movement = delta[event.key];
      if (!movement) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      event.preventDefault();
      const [x, y] = movement;
      place({ left: rect.left + x, top: rect.top + y }, rect);
    },
  };
}
