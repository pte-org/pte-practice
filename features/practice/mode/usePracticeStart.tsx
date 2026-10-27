"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useCallback, useState } from "react";
import { canStartPractice, type PracticeCatalogSection, type PracticeCatalogTask } from "../contracts";
import { usePractice } from "../PracticeProvider";
import { readModePreference, writeModePreference, type ModePreference } from "./mode-preference";
import { preferenceKey, runnableTasks, skillTarget, taskTarget, type ModeTarget } from "./mode-target";
import { PracticeModeDialog } from "./PracticeModeDialog";
import { practiceMockTestUrl, practiceSessionUrl, practiceSkillSessionUrl } from "./practice-url";

interface PracticeStart {
  openFor: (task: PracticeCatalogTask) => void;
  /** Starts practice for every task type of a skill; {@code title} is the skill's display name. */
  openForSkill: (section: PracticeCatalogSection, title: string) => void;
  /** Opens the timed / untimed choice for a mock test (see `mockTarget`). */
  openForMock: (target: ModeTarget) => void;
  dialog: ReactElement;
}

/** Task and skill practice is always untimed; only a mock test can be timed. */
function untimed(preference: ModePreference): ModePreference {
  return { ...preference, timingMode: "UNTIMED" };
}

/**
 * Handles starting practice for tasks, skills, and mock tests. Task and skill practice
 * navigate directly; mock tests open the timed/untimed choice dialog.
 */
export function usePracticeStart(): PracticeStart {
  const router = useRouter();
  const { isPracticeUnlocked } = usePractice();
  const [target, setTarget] = useState<ModeTarget | null>(null);

  const openFor = useCallback((candidate: PracticeCatalogTask) => {
    if (!isPracticeUnlocked || !canStartPractice("UNLOCKED", candidate)) return;
    const pref = readModePreference(preferenceKey(taskTarget(candidate)));
    router.push(practiceSessionUrl(candidate.code, untimed(pref)));
  }, [isPracticeUnlocked, router]);

  const openForSkill = useCallback((section: PracticeCatalogSection, title: string) => {
    if (!isPracticeUnlocked || runnableTasks(section).length === 0) return;
    const pref = readModePreference(preferenceKey(skillTarget(section, title)));
    router.push(practiceSkillSessionUrl(section.code, untimed(pref)));
  }, [isPracticeUnlocked, router]);

  const dialog = (
    <PracticeModeDialog target={target} onClose={() => setTarget(null)}
      onStart={(chosen, preference) => {
        writeModePreference(preferenceKey(chosen), preference);
        setTarget(null);
        router.push(chosen.kind === "mock"
          ? practiceMockTestUrl(chosen.code, chosen.restart ?? false, preference.timingMode)
          : chosen.kind === "skill"
            ? practiceSkillSessionUrl(chosen.code, untimed(preference))
            : practiceSessionUrl(chosen.code, untimed(preference)));
      }} />
  );

  return { openFor, openForSkill, openForMock: setTarget, dialog };
}
