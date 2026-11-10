"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type ReactElement } from "react";
import "./chat.css";
import "./chat-panel.css";
import { createChatApi } from "./api";
import { ChatPanel } from "./ChatPanel";
import { exerciseContextFrom } from "./chat-exercise";
import { CHAT_ENABLED } from "./chat-flag";
import { chatSessionStorage, readChatOpen, writeChatOpen } from "./chat-open-state";
import { isChatToggleShortcut } from "./chat-shortcut";
import { normalizeChatTaskType } from "./chat-task-type";
import { useChatQuota } from "./useChatQuota";
import { ChatLauncherContext } from "./ChatLauncher";

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
export function ChatLayout({ taskCode, exercisePrompt, children }: ChatLayoutProps): ReactElement {
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
  const launcherRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const api = useMemo(() => createChatApi(), []);
  const { quota, setQuota, refresh, unavailable, errorKey } = useChatQuota(api);

  // Read access and quota before the student opens the assistant through Pip.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Return focus to Pip or the element used for the keyboard shortcut when the panel closes.
  useEffect(() => {
    if (wasOpen.current && !open) {
      if (launcherRef.current?.isConnected) launcherRef.current.focus();
    }
    wasOpen.current = open;
  }, [open]);

  const setPanelOpen = useCallback((next: boolean) => {
    if (next) setOpenedOnce(true);
    setChosen(next);
    writeChatOpen(chatSessionStorage(), next);
  }, []);

  const launch = useCallback(() => {
    const focused = document.activeElement;
    launcherRef.current = focused instanceof HTMLElement ? focused : null;
    setPanelOpen(true);
  }, [setPanelOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isChatToggleShortcut(event)) return;
      event.preventDefault();
      if (open) setPanelOpen(false);
      else launch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [launch, open, setPanelOpen]);

  // API availability controls sending, not opening: Pip must never become inert after a failed read.
  return (
    <div className="chat-layout" data-open={open} data-unavailable={unavailable}>
      <ChatLauncherContext value={{ open: launch }}>
        <div className="chat-layout-main">{children}</div>
      </ChatLauncherContext>
      {everOpened ? (
        <ChatPanel
          api={api}
          quota={quota}
          setQuota={setQuota}
          refreshQuota={refresh}
          unavailable={unavailable}
          availabilityError={errorKey}
          open={open}
          taskType={normalizeChatTaskType(taskCode)}
          exercisePrompt={exerciseContextFrom(exercisePrompt)}
          onClose={() => setPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}
