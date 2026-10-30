import { Suspense } from "react";
import { LoadingState } from "@/common/components";
import { PracticeReviewView } from "@/features/practice/PracticeReviewView";
import { UI_TEXT } from "@/features/practice/constants";

export default function PracticeReviewPage() {
  return <Suspense fallback={<LoadingState message={UI_TEXT.reviewPageLoading} />}><PracticeReviewView /></Suspense>;
}
