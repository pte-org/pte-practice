"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { usePractice } from "@/features/practice/PracticeProvider";
import { DEFAULT_AVATAR_GENDER, type AvatarGender } from "./avatar";
import { fetchAvatarGender, saveAvatarGender } from "./avatar-api";

interface StudentAvatarValue {
  gender: AvatarGender;
  /** Shows the pick at once and saves it; rejects, after putting the old one back, when the server refuses. */
  choose: (next: AvatarGender) => Promise<void>;
}

const StudentAvatarContext = createContext<StudentAvatarValue | null>(null);

/**
 * One avatar for the whole shell, so the picker in Settings and the card in the rail always agree. Loading it never
 * blocks anything: until it arrives, and whenever it cannot be read, the default avatar shows.
 */
export const StudentAvatarProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { authStatus } = usePractice();
  const [gender, setGender] = useState<AvatarGender>(DEFAULT_AVATAR_GENDER);
  const current = useRef(gender);
  useEffect(() => { current.current = gender; }, [gender]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    fetchAvatarGender()
      .then((picked) => { if (!cancelled && picked) setGender(picked); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [authStatus]);

  const choose = useCallback(async (next: AvatarGender): Promise<void> => {
    const previous = current.current;
    setGender(next);
    try {
      await saveAvatarGender(next);
    } catch (error) {
      setGender(previous);
      throw error;
    }
  }, []);

  const value = useMemo<StudentAvatarValue>(() => ({ gender, choose }), [gender, choose]);
  return <StudentAvatarContext.Provider value={value}>{children}</StudentAvatarContext.Provider>;
};

export const useStudentAvatar = (): StudentAvatarValue => {
  const context = useContext(StudentAvatarContext);
  if (!context) throw new Error("useStudentAvatar requires StudentAvatarProvider");
  return context;
};
