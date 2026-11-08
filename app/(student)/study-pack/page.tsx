import type { Metadata } from "next";
import { StudyPackView } from "@/features/studyPack/StudyPackView";

// StudentShell renders this page only after client-side authentication; layout opt-outs are not inherited.
export const instant = false;

export const metadata: Metadata = {
  title: "Skill practice",
};

export default function StudyPackPage() {
  return <StudyPackView />;
}
