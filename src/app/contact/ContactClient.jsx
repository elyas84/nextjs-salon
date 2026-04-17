"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Clock3,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  company: "",
  message: "",
};

export default function ContactClient() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "We could not send your message.");
        return;
      }

      toast.success(data.message || "Message sent successfully.");
      setForm(initialForm);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative mx-auto w-full max-w-6xl">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-orange-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-orange-300">
              Contact
            </p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tighter text-zinc-50 sm:text-5xl">
              Let&apos;s talk
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-300">
              Services, orders, or general feedback—send a message and we&apos;ll
              get back to you by email.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="surface-panel flex gap-4 rounded-2xl p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-50">
                  <Clock3 className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    Response time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-50">
                    Usually within 24 business hours
                  </p>
                </div>
              </div>
              <div className="surface-panel flex gap-4 rounded-2xl p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-50">
                  <Mail className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    How we reply
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-50">
                    Confirmation first, then a direct follow-up
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-zinc-300" />
                <p className="text-sm leading-relaxed text-zinc-300">
                  Include your vehicle details and any warning lights/symptoms.
                  If you’re asking about an order, include the order number.
                </p>
              </div>
            </div>

            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-100 underline-offset-4 hover:underline"
            >
              Browse parts <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="surface-panel rounded-[1.75rem] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-zinc-50">
              <Send className="size-5" />
              <h2 className="text-xl font-extrabold">Send a message</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              All fields except company are required.
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Name
                </span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={updateField("name")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/30"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={updateField("email")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/30"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Company{" "}
                  <span className="font-normal text-zinc-500">(optional)</span>
                </span>
                <input
                  type="text"
                  value={form.company}
                  onChange={updateField("company")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/30"
                  placeholder="Company or team"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Message
                </span>
                <textarea
                  rows={6}
                  required
                  value={form.message}
                  onChange={updateField("message")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/30"
                  placeholder="How can we help?"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="kinetic-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Sending…" : "Send message"}
                {!loading ? <ArrowRight className="size-4" /> : null}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
