import type { PracticeSessionTokens } from "./contracts";

const SESSION_KEY = "pte.practice.session";

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
