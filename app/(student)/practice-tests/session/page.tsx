import { Suspense } from "react";
import { SessionSkeleton } from "@/features/practice/session/SessionSkeleton";
import { PracticeSessionView } from "@/features/practice/PracticeSessionView";

// Same as the home page: opt out of Next's instant-navigation validation, which drops this client-only segment.
export const instant = false;

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <PracticeSessionView />
    </Suspense>
  );
}
