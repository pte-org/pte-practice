import type { ReactNode } from "react";
import { PracticeProvider } from "@/features/practice/PracticeProvider";
import { StudentShell } from "@/features/shell/StudentShell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <PracticeProvider>
      <StudentShell>{children}</StudentShell>
    </PracticeProvider>
  );
}
