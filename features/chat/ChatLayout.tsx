"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import "./chat.css";
import { ChatPanel } from "./ChatPanel";
import { ChatToggleButton } from "./ChatToggleButton";
import { CHAT_ENABLED } from "./chat-flag";
import { normalizeChatTaskType } from "./chat-task-type";

interface ChatLayoutProps {
  /** Task code of the exercise on screen; unknown or unsupported codes simply send no task context. */
  taskCode: string | null | undefined;
  children: ReactNode;
}

/**
 * Wraps an exercise with the chat side panel. On wide screens the panel takes a column and the exercise
 * keeps the rest; on narrow ones it covers the page. The panel is created on first use and then only hidden,
 * so an unsent draft survives closing it.
 */
export function ChatLayout({ taskCode, children }: ChatLayoutProps) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // The toggle is hidden while the panel is open, so hand focus back to it when the panel closes.
  useEffect(() => {
    if (wasOpen.current && !open) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const show = () => {
    setEverOpened(true);
    setOpen(true);
  };

  // Hooks above run either way; with the flag off the exercise renders exactly as before the chat existed.
  if (!CHAT_ENABLED) return <>{children}</>;

  return (
    <div className="chat-layout" data-open={open}>
      <div className="chat-layout-main">{children}</div>
      {everOpened ? (
        <ChatPanel open={open} taskType={normalizeChatTaskType(taskCode)} onClose={() => setOpen(false)} />
      ) : null}
      <ChatToggleButton open={open} buttonRef={toggleRef} onClick={show} />
    </div>
  );
}
