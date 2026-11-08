"use client";

import { createContext, useContext } from "react";

interface ChatLauncherValue {
  open: () => void;
}

export const ChatLauncherContext = createContext<ChatLauncherValue | null>(null);
export const useChatLauncher = (): ChatLauncherValue | null => useContext(ChatLauncherContext);
