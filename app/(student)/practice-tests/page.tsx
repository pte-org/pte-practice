import type { Metadata } from "next";
import { PracticeTestsView } from "@/features/catalog/PracticeTestsView";

export const metadata: Metadata = {
  title: "Practice tests",
};

export default function PracticeTestsPage() {
  return <PracticeTestsView />;
}
