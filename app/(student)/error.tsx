"use client";

import { ErrorState } from "@/common/components";

export default function StudentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState reset={reset} />;
}
