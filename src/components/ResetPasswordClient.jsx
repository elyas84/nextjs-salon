"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import AuthPageBackground from "@/components/auth/auth-page-background";
import AuthPageFooter from "@/components/auth/auth-page-footer";
import {
  authCardClass,
  authInputClass,
  authPrimaryButtonClass,
} from "@/lib/auth-page-styles";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0908] text-stone-100">
      <AuthPageBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-amber-200/90"
          >
            <ArrowRight className="size-4 rotate-180 transition group-hover:-translate-x-0.5" />
            <span className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-stone-200 group-hover:text-stone-50">
              Studio{" "}
              <span className="text-amber-200/95 group-hover:text-amber-100">
                Salon
              </span>
            </span>
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className={authCardClass}>
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-stone-700/50 bg-white/[0.04]">
                <KeyRound className="size-6 text-amber-200/90" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                Password reset
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-stone-100 sm:text-3xl">
                Set a new password
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Choose a strong password you haven&apos;t used elsewhere.
              </p>

              {!token ? (
                <div className="mt-8 space-y-4">
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
                    This link is invalid or incomplete. Request a new reset
                    email.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200/90 transition hover:text-amber-100"
                  >
                    Request new link <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : done ? (
                <div className="mt-8 space-y-5">
                  <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
                    Your password was updated. You can sign in with the new one.
                  </p>
                  <Link
                    href="/login"
                    className={`${authPrimaryButtonClass} text-center`}
                  >
                    Go to sign in <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                      htmlFor="newPassword"
                    >
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${authInputClass} pr-12`}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition-colors hover:text-stone-100"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
                      {error}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/login"
                      className="text-sm font-semibold text-stone-400 transition hover:text-stone-100"
                    >
                      Back to sign in
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${authPrimaryButtonClass} w-full sm:w-auto`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Updating…
                        </>
                      ) : (
                        <>
                          Update password
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthPageFooter
        links={[
          { label: "Home", href: "/" },
          { label: "Sign in", href: "/login" },
        ]}
      />
    </div>
  );
}
