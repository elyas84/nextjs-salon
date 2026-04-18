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

export default function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

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
        // stay on register
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

  const onSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      toast.error("Please accept the terms to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      toast.success(data.message || "Account created.");
      window.dispatchEvent(new Event("auth-changed"));
      router.replace("/dashboard");
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
              Create account
            </p>
            <h1 className="mt-5 font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-stone-100">
              Join the{" "}
              <span className="text-stone-500">studio</span>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-stone-500 sm:text-base">
              One account for booking, checkout, and order history — set up in
              under a minute.
            </p>
            <div className="mt-10 hidden items-center gap-4 sm:flex">
              <div className="h-px w-16 bg-gradient-to-r from-amber-200/50 to-transparent" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-600">
                Secure registration
              </span>
            </div>
          </div>

          <div className="w-full justify-self-stretch lg:max-w-md lg:justify-self-end">
            <div className={authCardClass}>
              <div className="mb-8 lg:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                  Create account
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-stone-100">
                  Get started
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Email and password, or Google — one account either way.
                </p>
              </div>

              <div className="mb-8 hidden lg:block">
                <h2 className="font-heading text-xl font-semibold text-stone-100">
                  Get started
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  Use the form below, or continue with Google — your account is
                  created automatically on first Google sign-in.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                    htmlFor="name"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className={authInputClass}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={authInputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={authInputClass}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500"
                      htmlFor="confirm_password"
                    >
                      Confirm
                    </label>
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={authInputClass}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-stone-600 bg-stone-950 text-amber-600 focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-0 focus:ring-offset-[#0c0b09]"
                  />
                  <label
                    className="text-xs leading-relaxed text-stone-400"
                    htmlFor="terms"
                  >
                    I agree to the{" "}
                    <span className="text-amber-200/90">terms of service</span>{" "}
                    and <span className="text-amber-200/90">privacy policy</span>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${authPrimaryButtonClass} mt-2`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="size-4" aria-hidden />
                    </>
                  )}
                </button>
              </form>

              <GoogleSignInSection className="mt-8" />

              <p className="mt-8 text-center text-sm text-stone-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-amber-200/90 transition hover:text-amber-100"
                >
                  Sign in
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
