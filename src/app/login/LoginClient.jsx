"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";
import GoogleSignInSection from "@/components/auth/google-sign-in-section";
import AuthPageBackground from "@/components/auth/auth-page-background";
import AuthPageFooter from "@/components/auth/auth-page-footer";
import {
  authCardClass,
  authInputClass,
  authPrimaryButtonClass,
} from "@/lib/auth-page-styles";

const GOOGLE_ERROR_MESSAGES = {
  google_denied: "Google sign-in was cancelled.",
  google_config: "Google sign-in is not configured.",
  google_state: "Sign-in session expired. Please try again.",
  google_token: "Could not verify Google account. Please try again.",
  google_profile: "Could not read your Google profile.",
  google_account_mismatch: "This Google account is already linked to another user.",
  google_email_unverified: "Your Google email must be verified.",
  google_inactive: "This account is disabled.",
  google_server: "Something went wrong. Please try again.",
};

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err || !GOOGLE_ERROR_MESSAGES[err]) return;
    toast.error(GOOGLE_ERROR_MESSAGES[err]);
    router.replace("/login", { scroll: false });
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          router.replace(
            data.user?.role === "superadmin" ? "/admin" : "/dashboard",
          );
        }
      } catch {
        // stay on login
      }
    };

    const onPageShow = () => {
      checkSession();
    };

    checkSession();
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      toast.success(data.message || "Welcome back.");
      window.dispatchEvent(new Event("auth-changed"));
      router.replace(
        data.user?.role === "superadmin" ? "/admin" : "/dashboard",
      );
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
          <div className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/85">
              Sign in
            </p>
            <h1 className="mt-5 font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-stone-100">
              Your account,{" "}
              <span className="text-stone-500">your orders</span>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-stone-500 sm:text-base">
              Access your dashboard, track orders, and manage your profile —
              same secure sign-in for guests and team.
            </p>
            <div className="mt-10 hidden items-center gap-4 sm:flex">
              <div className="h-px w-16 bg-gradient-to-r from-amber-200/50 to-transparent" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-600">
                Encrypted session
              </span>
            </div>
          </div>

          <div className="w-full justify-self-stretch lg:max-w-md lg:justify-self-end">
            <div className={authCardClass}>
              <div className="mb-8 lg:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                  Sign in
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-stone-100">
                  Welcome back
                </h2>
              </div>

              <div className="mb-8 hidden lg:block">
                <h2 className="font-heading text-xl font-semibold text-stone-100">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Enter your email and password to continue.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={authInputClass}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label
                      className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90 transition hover:text-amber-100"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={authInputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${authPrimaryButtonClass} mt-2`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="size-4" aria-hidden />
                    </>
                  )}
                </button>
              </form>

              <GoogleSignInSection className="mt-8" />

              <p className="mt-8 text-center text-sm text-stone-500">
                No account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-amber-200/90 transition hover:text-amber-100"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthPageFooter />
    </div>
  );
}
