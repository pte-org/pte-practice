import type { Metadata } from "next";
import { ProgressView } from "@/features/progress/ProgressView";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return <ProgressView />;
}
