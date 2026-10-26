import type { TranslationKey } from "@/common/i18n";

/** Colour band of a 0-100 score: none while there is no score yet (shown as "—", never a red 0%). */
export type ScoreTone = "none" | "low" | "mid" | "high";

export function scoreTone(score: number | null): ScoreTone {
  if (score === null || !Number.isFinite(score)) return "none";
  if (score < 40) return "low";
  if (score < 70) return "mid";
  return "high";
}

export function formatScore(score: number | null): string {
  return score === null || !Number.isFinite(score) ? "—" : `${Math.round(score)}%`;
}

const SKILL_KEYS: Record<string, TranslationKey> = {
  SPEAKING: "skills.speaking",
  WRITING: "skills.writing",
  READING: "skills.reading",
  LISTENING: "skills.listening",
};

/** Translation key of a skill code; unknown codes fall back to speaking-free generic text via the caller. */
export function skillKey(code: string | null | undefined): TranslationKey | null {
  return code ? SKILL_KEYS[code.toUpperCase()] ?? null : null;
}

/** Localized display name of a PTE task code with fallback to the catalog title. */
export function taskDisplayName(
  code: string | null | undefined,
  fallback: string,
  t: (key: TranslationKey) => string,
): string {
  if (!code) return fallback;
  const key = `tasks.${code}` as TranslationKey;
  const translated = t(key);
  return translated && translated !== key ? translated : fallback;
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  ANSWERED: "presentation.statusAnswered",
  SKIPPED: "presentation.statusSkipped",
  PENDING: "presentation.statusPending",
};

export function itemStatusKey(status: string): TranslationKey {
  return STATUS_KEYS[status] ?? "presentation.statusPending";
}

export interface NamedSession {
  kind: string | null;
  skillCode: string | null;
  taskCode: string | null;
  title: string;
  totalItemCount: number;
}

/**
 * The name a student recognises for a session: a mock test keeps its title, a skill session reads
 * "Luyện Đọc · 10 câu", a single task type "Read Aloud · 10 câu". Sessions from before kinds existed read as one task.
 */
export function sessionDisplayName(session: NamedSession, taskName: (code: string) => string,
  t: (key: TranslationKey) => string): string {
  const count = `${session.totalItemCount} ${t("presentation.questions")}`;
  if (session.kind === "MOCK_TEST") return session.title;
  const skill = skillKey(session.skillCode);
  if (session.kind === "SKILL" && skill) {
    return `${t("presentation.skillPractice").replace("{skill}", t(skill))} · ${count}`;
  }
  if (session.taskCode) return `${taskName(session.taskCode)} · ${count}`;
  return session.title;
}
