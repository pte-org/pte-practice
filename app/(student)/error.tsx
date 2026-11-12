"use client";

import { ErrorPage, errorPageKindOf } from "@/common/components";

interface StudentErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function StudentError({ error, unstable_retry }: StudentErrorProps) {
  return <ErrorPage kind={errorPageKindOf(error)} onRetry={unstable_retry} />;
}
