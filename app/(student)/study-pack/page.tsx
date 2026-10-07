import type { Metadata } from "next";
import { StudyPackView } from "@/features/studyPack/StudyPackView";

export const metadata: Metadata = {
  title: "Study-Pack",
};

export default function StudyPackPage() {
  return <StudyPackView />;
}
