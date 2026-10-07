import type { ReactNode } from "react";
import { PracticeProvider } from "@/features/practice/PracticeProvider";
import { StudentShell } from "@/features/shell/StudentShell";

// The student shell reads sessionStorage and entitlement state on the client;
// keep this authenticated subtree out of Next's instant-shell validation until
// its runtime data can be streamed independently.
export const instant = false;

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <PracticeProvider>
      <StudentShell>{children}</StudentShell>
    </PracticeProvider>
  );
}
