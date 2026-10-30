import type { Metadata } from "next";
import { PrivacyPolicy } from "@/features/privacy/PrivacyPolicy";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
