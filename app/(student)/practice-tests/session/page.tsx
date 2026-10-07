import { Suspense } from "react";
import { LoadingState } from "@/common/components";
import { COMMON_TEXT } from "@/common/constants";
import { PracticeSessionView } from "@/features/practice/PracticeSessionView";

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<LoadingState message={COMMON_TEXT.loadingWorkspace} />}>
      <PracticeSessionView />
    </Suspense>
  );
}
