"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Calendar,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
};

/** Shown in the topic dropdown; stored on the message when picked. */
const CONTACT_TOPICS = [
  { value: "", label: "Select a topic (optional)" },
  { value: "Appointments & scheduling", label: "Appointments & scheduling" },
  { value: "Retail & products", label: "Retail & products" },
  { value: "Color, cut & styling", label: "Color, cut & styling" },
  { value: "Extensions & treatments", label: "Extensions & treatments" },
  { value: "Feedback or praise", label: "Feedback or praise" },
  { value: "Something else", label: "Something else" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:border-rose-500/35 focus:ring-2 focus:ring-rose-500/25";

const chevronSelect =
  "cursor-pointer appearance-none bg-[length:0.875rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

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
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          topic: form.topic,
          message: form.message,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "We could not send your message.");
        return;
      }

      toast.success(data.message || "Message sent — we’ll be in touch soon.");
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
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-rose-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-rose-300">
              Contact
            </p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tighter text-zinc-50 sm:text-5xl">
              We&apos;re here to help
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-300">
              Questions about an appointment, a product you bought, or the
              services we offer? Send a note — we reply by email.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="surface-panel flex gap-4 rounded-2xl p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-50">
                  <Clock3 className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    Reply time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-50">
                    Usually within one business day
                  </p>
                </div>
              </div>
              <div className="surface-panel flex gap-4 rounded-2xl p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-50">
                  <Mail className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    How we respond
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-50">
                    By email, to the address you enter below
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="surface-panel flex gap-4 rounded-2xl p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-rose-500/10 text-rose-200">
                  <Calendar className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    Prefer to book online?
                  </p>
                  <Link
                    href="/book-a-service"
                    className="mt-1 inline-flex text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                  >
                    Book an appointment →
                  </Link>
                </div>
              </div>
              <div className="surface-panel flex gap-4 rounded-2xl p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-rose-500/10 text-rose-200">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                    Shop retail
                  </p>
                  <Link
                    href="/products"
                    className="mt-1 inline-flex text-sm font-semibold text-rose-300 transition hover:text-rose-200"
                  >
                    Browse hair care & tools →
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-rose-300/90" />
                <p className="text-sm leading-relaxed text-zinc-300">
                  <span className="font-semibold text-zinc-200">Tip:</span>{" "}
                  For color or extension questions, mention your last visit or
                  what you&apos;re hoping to achieve — it helps us reply with
                  useful next steps.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[1.75rem] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-zinc-50">
              <Send className="size-5 text-rose-300/90" />
              <h2 className="text-xl font-extrabold">Write to us</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Name, email, and message are required. Phone and topic are
              optional.
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Your name
                </span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField("name")}
                  className={inputClass}
                  placeholder="First and last name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField("email")}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  <Phone className="size-3.5 text-zinc-500" aria-hidden />
                  Phone{" "}
                  <span className="font-normal normal-case tracking-normal text-zinc-500">
                    (optional)
                  </span>
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={updateField("phone")}
                  className={inputClass}
                  placeholder="If you’d like a call-back"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  Topic
                </span>
                <select
                  value={form.topic}
                  onChange={updateField("topic")}
                  className={`${inputClass} ${chevronSelect}`}
                  style={{ backgroundImage: SELECT_ARROW }}
                >
                  {CONTACT_TOPICS.map((opt) => (
                    <option
                      key={`${opt.value}-${opt.label}`}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                  className={`${inputClass} min-h-[9rem] resize-y leading-relaxed`}
                  placeholder="Tell us what you need — e.g. reschedule a color appointment, ask about a product, or share feedback after your visit."
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
