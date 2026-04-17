"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";

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
    <main className="relative flex min-h-[calc(100svh-160px)] items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-40">
          <div className="flex h-full w-full items-center justify-center px-6">
            <div className="w-full max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-xs font-extrabold uppercase tracking-[0.25em] text-zinc-500">
              No image
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <section className="rounded-xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl md:p-12">
          <div className="mb-10">
            <Link
              href="/"
              className="font-heading text-2xl font-black italic tracking-tighter text-orange-500"
            >
              FixPro
            </Link>
            <div className="mt-8 flex flex-col gap-2">
              <h1 className="font-heading text-4xl font-extrabold uppercase leading-none tracking-tight text-white md:text-5xl">
                Recover access
              </h1>
              <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-zinc-300">
                Enter your registered email address to receive a password reset
                link.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <div className="group space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 transition-colors group-focus-within:text-orange-300"
              >
                Registered Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@precision.com"
                className="w-full rounded-md border-b-2 border-transparent bg-zinc-800 px-4 py-3.5 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-all focus:border-orange-500 focus:ring-0"
              />
            </div>

            <div className="space-y-6 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="kinetic-gradient group inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 font-heading text-sm font-bold uppercase tracking-tight text-zinc-950 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Initializing..." : "Initialize recovery"}
                {!loading ? (
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                ) : null}
              </button>

              <div className="flex items-center justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors duration-300 hover:text-orange-300"
                >
                  <span aria-hidden>←</span>
                  Back to login
                </Link>
              </div>
            </div>
          </form>

          <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8 opacity-60">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">
                Security Protocol
              </span>
              <span className="font-heading text-xs font-black tracking-tighter text-white">
                RSA-4096 / AES-256
              </span>
            </div>
            <div className="h-px w-12 bg-white/20" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">
                Auth Status
              </span>
              <span className="font-heading text-xs font-black tracking-tighter text-white">
                WAITING_FOR_INPUT
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
