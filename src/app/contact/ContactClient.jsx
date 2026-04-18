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
  "w-full rounded-xl border border-stone-700/50 bg-white/[0.04] px-4 py-3 text-sm text-stone-100 shadow-sm outline-none transition placeholder:text-stone-600 focus:border-amber-500/35 focus:ring-2 focus:ring-amber-500/20";

const chevronSelect =
  "cursor-pointer appearance-none bg-[length:0.875rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23787569' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const panelCard =
  "surface-panel flex gap-4 rounded-2xl border border-stone-800/60 p-5";

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
    <div className="bg-[#0a0908]">
      <section className="relative border-b border-stone-800/50 py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-10%,rgba(253,230,138,0.07),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_30%,rgba(244,114,182,0.04),transparent_45%)]" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-amber-200/85">
                Contact
              </p>
              <h1 className="mt-5 font-heading text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight text-stone-100">
                We&apos;re here to help
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-500 sm:text-base">
                Questions about an appointment, a product you bought, or the
                services we offer? Send a note — we reply by email.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className={panelCard}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-stone-700/50 bg-white/[0.04] text-stone-100">
                    <Clock3 className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                      Reply time
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-100">
                      Usually within one business day
                    </p>
                  </div>
                </div>
                <div className={panelCard}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-stone-700/50 bg-white/[0.04] text-stone-100">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                      How we respond
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-100">
                      By email, to the address you enter below
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className={panelCard}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-500/10 text-amber-200">
                    <Calendar className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                      Prefer to book online?
                    </p>
                    <Link
                      href="/book-a-service"
                      className="mt-1 inline-flex text-sm font-semibold text-amber-200/90 transition hover:text-amber-100"
                    >
                      Book an appointment →
                    </Link>
                  </div>
                </div>
                <div className={panelCard}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-500/10 text-amber-200">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                      Shop retail
                    </p>
                    <Link
                      href="/products"
                      className="mt-1 inline-flex text-sm font-semibold text-amber-200/90 transition hover:text-amber-100"
                    >
                      Browse hair care & tools →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-dashed border-stone-700/50 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 size-5 shrink-0 text-amber-200/90" />
                  <p className="text-sm leading-relaxed text-stone-400">
                    <span className="font-semibold text-stone-200">Tip:</span>{" "}
                    For color or extension questions, mention your last visit or
                    what you&apos;re hoping to achieve — it helps us reply with
                    useful next steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-[1.75rem] border border-stone-800/60 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-stone-100">
                <Send className="size-5 text-amber-200/90" />
                <h2 className="text-xl font-semibold">Write to us</h2>
              </div>
              <p className="mt-2 text-sm text-stone-500">
                Name, email, and message are required. Phone and topic are
                optional.
              </p>

              <form onSubmit={onSubmit} className="mt-8 grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
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
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
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
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                    <Phone className="size-3.5 text-stone-600" aria-hidden />
                    Phone{" "}
                    <span className="font-normal normal-case tracking-normal text-stone-600">
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
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
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
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-100 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-950 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {loading ? "Sending…" : "Send message"}
                  {!loading ? <ArrowRight className="size-4" /> : null}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
