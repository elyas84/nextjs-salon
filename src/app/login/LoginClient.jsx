"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";
import GoogleSignInSection from "@/components/auth/google-sign-in-section";

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

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(244,114,182,0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_100%_100%,rgba(244,114,182,0.06),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/25 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-rose-300"
          >
            <ArrowRight className="size-4 rotate-180 transition group-hover:-translate-x-0.5" />
            <span className="font-heading text-xs font-black uppercase tracking-[0.2em] text-zinc-200 group-hover:text-rose-200">
              Studio <span className="text-rose-400">Salon</span>
            </span>
          </Link>
        </header>

        <div className="grid flex-1 grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
          <div className="max-w-lg">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300/90">
              Sign in
            </p>
            <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-[1.05] tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Your account,{" "}
              <span className="text-zinc-500">your orders</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-zinc-400 sm:text-lg">
              Access the store dashboard, track shipments, and manage your
              profile — same secure login for customers and team.
            </p>
            <div className="mt-10 hidden items-center gap-4 sm:flex">
              <div className="h-px w-16 bg-gradient-to-r from-rose-500/60 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
                Session encrypted
              </span>
            </div>
          </div>

          <div className="w-full justify-self-stretch lg:max-w-md lg:justify-self-end">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
              <div className="mb-8 lg:hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300/90">
                  Sign in
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold text-zinc-50">
                  Welcome back
                </h2>
              </div>

              <div className="mb-8 hidden lg:block">
                <h2 className="font-heading text-xl font-bold text-zinc-50">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Enter your email and password to continue.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500"
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
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[10px] font-semibold uppercase tracking-wide text-rose-300/90 transition hover:text-rose-200"
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
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="kinetic-gradient mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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

              <p className="mt-8 text-center text-sm text-zinc-500">
                No account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-rose-300 transition hover:text-rose-200"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-zinc-950/80 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-zinc-600 sm:flex-row">
          <span>© Studio Salon</span>
          <div className="flex gap-6">
            <Link href="/" className="transition hover:text-zinc-400">
              Home
            </Link>
            <Link href="/products" className="transition hover:text-zinc-400">
              Shop
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
