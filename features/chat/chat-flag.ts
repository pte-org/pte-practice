/**
 * The chat panel is shown only when `NEXT_PUBLIC_CHAT_ENABLED` is "true". The backend registers its chat
 * endpoints only while `chat.ai.enabled` is on, so a web build that ships first would give every student a
 * button that fails. Turn this flag on together with the backend flag, and off to hide the panel again.
 */
export function isChatEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Read once at module load: Next inlines `NEXT_PUBLIC_*` values into the client bundle at build time. */
export const CHAT_ENABLED = isChatEnabled(process.env.NEXT_PUBLIC_CHAT_ENABLED);
