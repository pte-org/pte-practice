"use client";

import { useSyncExternalStore } from "react";
import { readAssistantName, subscribeAssistantName } from "./assistant-name";

const serverName = (): null => null;

/** Device-only display preference; never sent to the backend or included in model prompts. */
export function useAssistantName(): string | null {
  return useSyncExternalStore(subscribeAssistantName, readAssistantName, serverName);
}
