"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";
import GoogleSignInSection from "@/components/auth/google-sign-in-section";

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

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(234,88,12,0.14),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_100%_100%,rgba(234,88,12,0.06),transparent_50%)]"
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
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-orange-300"
          >
            <ArrowRight className="size-4 rotate-180 transition group-hover:-translate-x-0.5" />
            <span className="font-heading text-xs font-black uppercase tracking-[0.2em] text-zinc-200 group-hover:text-orange-200">
              Fix<span className="text-orange-400">Pro</span>
            </span>
          </Link>
        </header>

        <div className="grid flex-1 grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
          <div className="max-w-lg">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-300/90">
              Create account
            </p>
            <h1 className="mt-4 font-heading text-4xl font-black uppercase leading-[1.05] tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Join the{" "}
              <span className="text-zinc-500">performance grid</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-zinc-400 sm:text-lg">
              One account for checkout, order history, and updates — set up in
              under a minute.
            </p>
            <div className="mt-10 hidden items-center gap-4 sm:flex">
              <div className="h-px w-16 bg-gradient-to-r from-orange-500/60 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
                Secure registration
              </span>
            </div>
          </div>

          <div className="w-full justify-self-stretch lg:max-w-md lg:justify-self-end">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
              <div className="mb-8 lg:hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300/90">
                  Create account
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold text-zinc-50">
                  Get started
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Email and password, or Google — one account either way.
                </p>
              </div>

              <div className="mb-8 hidden lg:block">
                <h2 className="font-heading text-xl font-bold text-zinc-50">
                  Get started
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Use the form below, or continue with Google — same account as
                  sign-in, created automatically on first use.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500"
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
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500"
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
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500"
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
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500"
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
                      className={inputClass}
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
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-zinc-950 text-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:ring-offset-0 focus:ring-offset-zinc-950"
                  />
                  <label
                    className="text-xs leading-relaxed text-zinc-400"
                    htmlFor="terms"
                  >
                    I agree to the{" "}
                    <span className="text-orange-300/90">terms of service</span>
                    {" "}and{" "}
                    <span className="text-orange-300/90">privacy policy</span>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="kinetic-gradient mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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

              <p className="mt-8 text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-orange-300 transition hover:text-orange-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-zinc-950/80 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-zinc-600 sm:flex-row">
          <span>© FixPro</span>
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
