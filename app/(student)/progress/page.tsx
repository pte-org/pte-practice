import type { Metadata } from "next";
import { ProgressView } from "@/features/progress/ProgressView";

// StudentShell renders this page only after client-side authentication; layout opt-outs are not inherited.
export const instant = false;

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return <ProgressView />;
}
