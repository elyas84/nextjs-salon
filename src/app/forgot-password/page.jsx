"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";
import AuthPageBackground from "@/components/auth/auth-page-background";
import AuthPageFooter from "@/components/auth/auth-page-footer";
import {
  authCardClass,
  authInputClass,
  authPrimaryButtonClass,
} from "@/lib/auth-page-styles";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send reset link.");
        setLoading(false);
        return;
      }

      toast.success(
        data.message || "If this email exists, a reset link has been sent.",
      );
      setLoading(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
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

        <div className="grid flex-1 grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
          <div className="hidden max-w-lg lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/85">
              Account
            </p>
            <h1 className="mt-5 font-heading text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-stone-100">
              Reset your{" "}
              <span className="text-stone-500">password</span>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-stone-500 sm:text-base">
              We&apos;ll email you a secure link to choose a new password. The
              link expires after a short time for your safety.
            </p>
            <div className="mt-10 hidden items-center gap-4 sm:flex">
              <div className="h-px w-16 bg-gradient-to-r from-amber-200/50 to-transparent" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-600">
                Same login as booking & shop
              </span>
            </div>
          </div>

          <div className="w-full justify-self-stretch lg:max-w-md lg:justify-self-end">
            <div className={authCardClass}>
              <div className="mb-8 lg:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                  Account
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-stone-100">
                  Recover access
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  Enter the email you used to register. We&apos;ll send a reset
                  link if we find an account.
                </p>
              </div>

              <div className="mb-8 hidden lg:block">
                <h2 className="font-heading text-xl font-semibold text-stone-100">
                  Recover access
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Enter your registered email — we&apos;ll send a password reset
                  link.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={authInputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={authPrimaryButtonClass}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="size-4" aria-hidden />
                    </>
                  )}
                </button>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400 transition hover:text-amber-200/90"
                  >
                    <span aria-hidden>←</span>
                    Back to sign in
                  </Link>
                </div>
              </form>

              <p className="mt-10 border-t border-stone-800/70 pt-8 text-center text-xs leading-relaxed text-stone-600">
                Didn&apos;t get an email? Check spam, or try again in a few
                minutes.
              </p>
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
