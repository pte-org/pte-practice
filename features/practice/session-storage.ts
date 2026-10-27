import type { PracticeSessionTokens } from "./contracts";
import { PRACTICE_STORAGE_KEYS } from "./constants";

const SESSION_KEY = PRACTICE_STORAGE_KEYS.session;
const DRAFT_KEY_PREFIX = PRACTICE_STORAGE_KEYS.draftPrefix;

export interface PracticeLocalDraft {
  payload: Record<string, unknown>;
  savedAt: number;
}

// Tokens live in localStorage so a new tab stays signed in; signing out clears them with every saved draft.
export function getPracticeSession(): PracticeSessionTokens | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PracticeSessionTokens>;
    if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string") return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : "Bearer",
      expiresInSeconds: typeof parsed.expiresInSeconds === "number" ? parsed.expiresInSeconds : 0,
      mustChangePassword: Boolean(parsed.mustChangePassword),
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : undefined,
    };
  } catch {
    return null;
  }
}

export function savePracticeSession(tokens: PracticeSessionTokens): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const expiresAt = tokens.expiresAt ?? Date.now() + tokens.expiresInSeconds * 1000;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...tokens, expiresAt }));
}

export function clearPracticeSession(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(SESSION_KEY);
}

/** Explicit sign-out only: a shared computer must not keep the previous student's unsent answers. */
export function clearPracticeDrafts(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const draftKeys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(DRAFT_KEY_PREFIX)) draftKeys.push(key);
  }
  draftKeys.forEach((key) => window.localStorage.removeItem(key));
}

export function getPracticeDraft(sessionPublicId: string, itemPublicId: string): PracticeLocalDraft | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(sessionPublicId, itemPublicId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PracticeLocalDraft>;
    if (!parsed.payload || typeof parsed.payload !== "object" || Array.isArray(parsed.payload)) return null;
    return { payload: parsed.payload as Record<string, unknown>, savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0 };
  } catch {
    return null;
  }
}

export function savePracticeDraft(sessionPublicId: string, itemPublicId: string,
  payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(draftKey(sessionPublicId, itemPublicId), JSON.stringify({ payload, savedAt: Date.now() }));
  } catch {
    // Draft persistence is best effort; the server remains the source of truth.
  }
}

export function clearPracticeDraft(sessionPublicId: string, itemPublicId: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(draftKey(sessionPublicId, itemPublicId));
}

function draftKey(sessionPublicId: string, itemPublicId: string): string {
  return `${DRAFT_KEY_PREFIX}${sessionPublicId}.${itemPublicId}`;
}
