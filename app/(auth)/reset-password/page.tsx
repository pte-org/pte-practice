import { Suspense } from "react";
import { ResetPasswordView } from "@/features/auth/ResetPasswordView";

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordView /></Suspense>;
}
