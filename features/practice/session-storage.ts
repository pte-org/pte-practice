import type { PracticeSessionTokens } from "./contracts";

const SESSION_KEY = "pte.practice.session";
const DRAFT_KEY_PREFIX = "pte.practice.draft.";
export const CONFIDENCE_HINT_KEY = "pte.practice.confidence-hint.dismissed";

export interface PracticeLocalDraft {
  payload: Record<string, unknown>;
  savedAt: number;
}

export function getPracticeSession(): PracticeSessionTokens | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
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
  if (typeof window === "undefined" || !window.sessionStorage) return;
  const expiresAt = tokens.expiresAt ?? Date.now() + tokens.expiresInSeconds * 1000;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...tokens, expiresAt }));
}

export function clearPracticeSession(): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  window.sessionStorage.removeItem(SESSION_KEY);
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

export function isConfidenceHintDismissed(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  return window.localStorage.getItem(CONFIDENCE_HINT_KEY) === "true";
}

export function dismissConfidenceHint(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(CONFIDENCE_HINT_KEY, "true");
  window.dispatchEvent(new Event(CONFIDENCE_HINT_KEY));
}

function draftKey(sessionPublicId: string, itemPublicId: string): string {
  return `${DRAFT_KEY_PREFIX}${sessionPublicId}.${itemPublicId}`;
}
