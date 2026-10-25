import { PRACTICE_ROUTES } from "../constants";
import type { ModePreference } from "./mode-preference";

/** Where a started practice is opened: the task, the chosen mode and the question count travel in the URL. */
export function practiceSessionUrl(taskCode: string, preference: ModePreference): string {
  const params = new URLSearchParams({
    task: taskCode,
    mode: preference.timingMode,
    count: String(preference.questionCount),
  });
  return `${PRACTICE_ROUTES.practiceSession}?${params.toString()}`;
}

/** Where a started skill practice is opened; the server draws questions from every task type of the skill. */
export function practiceSkillSessionUrl(skillCode: string, preference: ModePreference): string {
  const params = new URLSearchParams({
    skill: skillCode,
    mode: preference.timingMode,
    count: String(preference.questionCount),
  });
  return `${PRACTICE_ROUTES.practiceSession}?${params.toString()}`;
}

/** Where a full mock test is opened; {@code restart} abandons an unfinished attempt and begins again. */
export function practiceMockTestUrl(mockTestId: string, restart = false): string {
  const params = new URLSearchParams({ mockTest: mockTestId });
  if (restart) params.set("restart", "1");
  return `${PRACTICE_ROUTES.practiceSession}?${params.toString()}`;
}
