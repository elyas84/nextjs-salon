"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20";

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

        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <KeyRound className="size-6 text-orange-300" />
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300/90">
                Password reset
              </p>
              <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                Set a new password
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Choose a strong password you have not used elsewhere.
              </p>

              {!token ? (
                <div className="mt-8 space-y-4">
                  <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    This link is invalid or incomplete. Request a new reset
                    email.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300 transition hover:text-orange-200"
                  >
                    Request new link <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : done ? (
                <div className="mt-8 space-y-5">
                  <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
                    Your password was updated. You can sign in with the new
                    one.
                  </p>
                  <Link
                    href="/login"
                    className="kinetic-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-black/30 transition hover:brightness-110"
                  >
                    Go to sign in <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500"
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
                        className={`${inputClass} pr-12`}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
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
                      className="text-sm font-semibold text-zinc-400 transition hover:text-zinc-200"
                    >
                      Back to sign in
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="kinetic-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-lg shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-zinc-950/80 px-4 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-zinc-600 sm:flex-row">
          <span>© FixPro</span>
          <div className="flex gap-6">
            <Link href="/" className="transition hover:text-zinc-400">
              Home
            </Link>
            <Link href="/login" className="transition hover:text-zinc-400">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
