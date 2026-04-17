import { Suspense } from "react";
import ResetPasswordClient from "@/components/ResetPasswordClient";

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-sm text-zinc-500">
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
