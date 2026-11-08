import type { Metadata } from "next";
import { PracticeTestsView } from "@/features/catalog/PracticeTestsView";

// StudentShell renders this page only after client-side authentication; layout opt-outs are not inherited.
export const instant = false;

export const metadata: Metadata = {
  title: "Practice tests",
};

export default function PracticeTestsPage() {
  return <PracticeTestsView />;
}
