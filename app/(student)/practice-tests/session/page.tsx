import { Suspense } from "react";
import { LoadingState } from "@/common/components";
import { COMMON_TEXT } from "@/common/constants";
import { PracticeSessionView } from "@/features/practice/PracticeSessionView";

// Same as the home page: opt out of Next's instant-navigation validation, which drops this client-only segment.
export const instant = false;

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<LoadingState message={COMMON_TEXT.loadingWorkspace} />}>
      <PracticeSessionView />
    </Suspense>
  );
}
