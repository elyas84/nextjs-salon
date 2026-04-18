import { Suspense } from "react";
import ResetPasswordClient from "@/components/ResetPasswordClient";

export const metadata = {
  title: "Reset password",
  description: "Choose a new password for your Studio Salon account.",
};

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0908] px-4 text-sm text-stone-500">
      Loading…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
