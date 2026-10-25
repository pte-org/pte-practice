"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useCallback, useState } from "react";
import { canStartPractice, type PracticeCatalogSection, type PracticeCatalogTask } from "../contracts";
import { usePractice } from "../PracticeProvider";
import { writeModePreference } from "./mode-preference";
import { preferenceKey, runnableTasks, skillTarget, taskTarget, type ModeTarget } from "./mode-target";
import { PracticeModeDialog } from "./PracticeModeDialog";
import { practiceSessionUrl, practiceSkillSessionUrl } from "./practice-url";

interface PracticeStart {
  openFor: (task: PracticeCatalogTask) => void;
  /** Opens the dialog for every task type of a skill; {@code title} is the skill's display name. */
  openForSkill: (section: PracticeCatalogSection, title: string) => void;
  dialog: ReactElement;
}

/**
 * Every "start practice" button goes through this: it opens the mode dialog for a task type or a skill and, once
 * the student confirms, remembers the choice and opens the session. Render {@code dialog} once next to the buttons.
 */
export function usePracticeStart(): PracticeStart {
  const router = useRouter();
  const { isPracticeUnlocked } = usePractice();
  const [target, setTarget] = useState<ModeTarget | null>(null);

  const openFor = useCallback((candidate: PracticeCatalogTask) => {
    if (!isPracticeUnlocked || !canStartPractice("UNLOCKED", candidate)) return;
    setTarget(taskTarget(candidate));
  }, [isPracticeUnlocked]);

  const openForSkill = useCallback((section: PracticeCatalogSection, title: string) => {
    if (!isPracticeUnlocked || runnableTasks(section).length === 0) return;
    setTarget(skillTarget(section, title));
  }, [isPracticeUnlocked]);

  const dialog = (
    <PracticeModeDialog target={target} onClose={() => setTarget(null)}
      onStart={(chosen, preference) => {
        writeModePreference(preferenceKey(chosen), preference);
        setTarget(null);
        router.push(chosen.kind === "skill"
          ? practiceSkillSessionUrl(chosen.code, preference)
          : practiceSessionUrl(chosen.code, preference));
      }} />
  );

  return { openFor, openForSkill, dialog };
}
