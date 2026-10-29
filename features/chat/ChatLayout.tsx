"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import "./chat.css";
import { createChatApi } from "./api";
import { ChatPanel } from "./ChatPanel";
import { ChatToggleButton } from "./ChatToggleButton";
import { exerciseContextFrom } from "./chat-exercise";
import { CHAT_ENABLED } from "./chat-flag";
import { chatSessionStorage, readChatOpen, writeChatOpen } from "./chat-open-state";
import { isChatToggleShortcut } from "./chat-shortcut";
import { normalizeChatTaskType } from "./chat-task-type";
import { useChatQuota } from "./useChatQuota";

const noopSubscribe = () => () => {};

interface ChatLayoutProps {
  /** Task code of the exercise on screen; unknown or unsupported codes simply send no task context. */
  taskCode: string | null | undefined;
  /** Text of the exercise on screen; the assistant uses it when a question is about that exercise. */
  exercisePrompt?: string | null;
  children: ReactNode;
}

/**
 * Wraps an exercise with a small floating chat box. With the flag off the exercise renders exactly as before the
 * chat existed and nothing here runs, not even a quota request.
 */
export function ChatLayout({ taskCode, exercisePrompt, children }: ChatLayoutProps) {
  if (!CHAT_ENABLED) return <>{children}</>;
  return <EnabledChatLayout taskCode={taskCode} exercisePrompt={exercisePrompt}>{children}</EnabledChatLayout>;
}

/**
 * The box floats bottom right over the exercise, so the student can chat while working and the exercise never
 * moves or loses its place. The panel is created on first use and then only hidden, so an unsent draft survives closing it. Whether it
 * was open is remembered for the browser tab, so moving to the next question keeps it where the student left it.
 */
function EnabledChatLayout({ taskCode, exercisePrompt, children }: ChatLayoutProps) {
  // The remembered state is read as an external snapshot: the server render and first client render say
  // "closed", then React re-renders with the stored value, so there is no hydration mismatch.
  const storedOpen = useSyncExternalStore(noopSubscribe, () => readChatOpen(chatSessionStorage()), () => false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [openedOnce, setOpenedOnce] = useState(false);
  const open = chosen ?? storedOpen;
  const everOpened = openedOnce || open;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const api = useMemo(() => createChatApi(), []);
  const { quota, setQuota, refresh, unavailable } = useChatQuota(api);

  // The badge on the closed toggle needs the count before the panel has ever been opened.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The toggle is hidden while the panel is open, so hand focus back to it when the panel closes.
  useEffect(() => {
    if (wasOpen.current && !open) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const setPanelOpen = useCallback((next: boolean) => {
    if (next) setOpenedOnce(true);
    setChosen(next);
    writeChatOpen(chatSessionStorage(), next);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (unavailable || !isChatToggleShortcut(event)) return;
      event.preventDefault();
      setPanelOpen(!open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setPanelOpen, unavailable]);

  // The wrapper stays even when chat is unavailable so the exercise inside is never remounted; only the
  // button, the panel and the side gutter go away.
  return (
    <div className="chat-layout" data-open={unavailable ? false : open} data-unavailable={unavailable}>
      <div className="chat-layout-main">{children}</div>
      {everOpened && !unavailable ? (
        <ChatPanel
          api={api}
          quota={quota}
          setQuota={setQuota}
          refreshQuota={refresh}
          open={open}
          taskType={normalizeChatTaskType(taskCode)}
          exercisePrompt={exerciseContextFrom(exercisePrompt)}
          onClose={() => setPanelOpen(false)}
        />
      ) : null}
      {unavailable ? null : (
        <ChatToggleButton open={open} quota={quota} buttonRef={toggleRef} onClick={() => setPanelOpen(true)} />
      )}
    </div>
  );
}
