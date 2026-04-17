"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ClipboardList,
  Scissors,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  formatSlotLabel,
  isAllowedBookingDate,
  isValidPublicBookingSlot,
  slotsAvailableForPublicBooking,
} from "@/lib/booking-slots";
import {
  BOOKING_REFERENCE_MAX_LEN,
  normalizeBookingReference,
} from "@/lib/booking-reference";
import DatePicker from "@/components/ui/DatePicker";

const DEFAULT_SERVICE = "Haircut & finish";

const SERVICE_OPTIONS = [
  {
    value: "Haircut & finish",
    blurb: "Cut, blow-dry & finish",
  },
  {
    value: "Color / gloss",
    blurb: "Color, gloss & toning",
  },
  {
    value: "Treatment & repair",
    blurb: "Deep care & repair",
  },
  {
    value: "Bridal or event styling",
    blurb: "Special-occasion looks",
  },
  {
    value: "Consultation",
    blurb: "Plan your next visit",
  },
];

const STEPS_META = [
  {
    id: 1,
    title: "Contact",
    subtitle: "How we reach you",
    icon: User,
  },
  {
    id: 2,
    title: "Service",
    subtitle: "What you’re booking",
    icon: Scissors,
  },
  {
    id: 3,
    title: "Schedule",
    subtitle: "Date & time",
    icon: Calendar,
  },
  {
    id: 4,
    title: "Confirm",
    subtitle: "Notes & send",
    icon: ClipboardList,
  },
];

const chevronSelect =
  "bg-[length:0.875rem] bg-[right_0.65rem_center] bg-no-repeat pr-9";

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

function formatDisplayDate(iso) {
  const raw = String(iso || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return raw || "—";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function BookingFormClient() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    registrationNumber: "",
    serviceType: DEFAULT_SERVICE,
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const timeOptions = useMemo(
    () => slotsAvailableForPublicBooking(form.preferredDate),
    [form.preferredDate],
  );

  useEffect(() => {
    if (!timeOptions.length) {
      setForm((p) => (p.preferredTime ? { ...p, preferredTime: "" } : p));
      return;
    }
    setForm((p) =>
      timeOptions.includes(p.preferredTime)
        ? p
        : { ...p, preferredTime: timeOptions[0] },
    );
  }, [form.preferredDate, timeOptions]);

  useEffect(() => {
    if (!form.preferredDate) return;
    if (!isAllowedBookingDate(form.preferredDate)) {
      setForm((p) => ({ ...p, preferredDate: "", preferredTime: "" }));
    }
  }, [form.preferredDate]);

  const isBookingDayDisabled = useCallback((d) => {
    const t = new Date();
    const startToday = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (startD < startToday) return true;
    if (d.getDay() === 0) return true;
    return false;
  }, []);

  const validateStep = useCallback(
    (s) => {
      if (s === 1) {
        if (!form.fullName.trim() || !form.email.trim()) {
          toast.error("Enter your name and email.");
          return false;
        }
        return true;
      }
      if (s === 2) {
        if (!form.registrationNumber.trim()) {
          toast.error(
            "Add a booking reference — e.g. your name, a nickname, or your pet’s name.",
          );
          return false;
        }
        if (!form.serviceType.trim()) {
          toast.error("Choose a service.");
          return false;
        }
        return true;
      }
      if (s === 3) {
        if (!form.preferredDate.trim() || !form.preferredTime.trim()) {
          toast.error("Choose a date and time.");
          return false;
        }
        if (!isAllowedBookingDate(form.preferredDate)) {
          toast.error("Choose a future open day (not Sunday).");
          return false;
        }
        if (!isValidPublicBookingSlot(form.preferredDate, form.preferredTime)) {
          toast.error(
            "That time isn’t available — pick another slot within our hours.",
          );
          return false;
        }
        return true;
      }
      return true;
    },
    [form],
  );

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((x) => Math.min(4, x + 1));
  };

  const goBack = () => setStep((x) => Math.max(1, x - 1));

  /** Only called from the step-4 “Submit booking request” button — not from Continue or implicit form submit. */
  const submitBooking = async () => {
    if (submitting) return;
    if (step !== 4) return;

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error("Please review each step — something is missing.");
      return;
    }

    const registrationNumber = normalizeBookingReference(form.registrationNumber);
    if (!registrationNumber) {
      toast.error(
        "Enter a booking reference — e.g. your name, a nickname, or your pet’s name.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, registrationNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to request booking.");
        return;
      }
      toast.success(data.message || "Booking saved.");
      setForm({
        fullName: "",
        phone: "",
        email: "",
        registrationNumber: "",
        serviceType: DEFAULT_SERVICE,
        preferredDate: "",
        preferredTime: "",
        notes: "",
      });
      setStep(1);
    } catch {
      toast.error("Failed to request booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const preventImplicitSubmit = (e) => {
    e.preventDefault();
  };

  const blockEnterSubmitUnlessFinalStep = (e) => {
    if (step === 4) return;
    if (e.key !== "Enter") return;
    const tag = e.target?.tagName?.toUpperCase?.() || "";
    if (tag === "TEXTAREA") return;
    e.preventDefault();
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-stone-700/60 bg-stone-950/40 px-3.5 text-sm text-stone-100 shadow-sm outline-none transition placeholder:text-stone-500 hover:border-stone-600/80 focus:border-amber-500/45 focus:bg-stone-900/50 focus:ring-2 focus:ring-amber-500/20";

  const selectClass = `${inputClass} cursor-pointer appearance-none ${chevronSelect}`;

  return (
    <form
      className="mt-6"
      onSubmit={preventImplicitSubmit}
      onKeyDown={blockEnterSubmitUnlessFinalStep}
    >
      {/* Progress */}
      <div className="mb-8">
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          {STEPS_META.map((meta, idx) => {
            const n = idx + 1;
            const done = step > n;
            const active = step === n;
            const Icon = meta.icon;
            return (
              <li key={meta.id} className="flex flex-1 items-center gap-3">
                <div
                  className={[
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-colors",
                    done
                      ? "border-amber-500/45 bg-amber-500/15 text-amber-100"
                      : active
                        ? "border-amber-400/50 bg-amber-500/12 text-amber-50"
                        : "border-stone-700/60 bg-stone-950/40 text-stone-500",
                  ].join(" ")}
                >
                  {done ? (
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Icon className="size-4" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1 sm:max-w-none">
                  <p
                    className={[
                      "text-[11px] font-semibold uppercase tracking-[0.2em]",
                      active || done ? "text-amber-200/95" : "text-stone-500",
                    ].join(" ")}
                  >
                    {meta.title}
                  </p>
                  <p className="truncate text-xs text-stone-500">{meta.subtitle}</p>
                </div>
                {idx < STEPS_META.length - 1 ? (
                  <div
                    className="mx-1 hidden h-px flex-1 bg-gradient-to-r from-stone-600/40 to-transparent sm:block sm:min-w-[1rem]"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <div
          className="mt-6 h-1.5 overflow-hidden rounded-full bg-stone-800/80"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400/90 to-amber-600/90 transition-[width] duration-300 ease-out"
            style={{ width: `${((step - 1) / (STEPS_META.length - 1)) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center text-[11px] font-medium text-stone-500 sm:text-left">
          Step {step} of {STEPS_META.length}
        </p>
      </div>

      {/* Step panels */}
      <div className="min-h-[280px]">
        {step === 1 ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            <p className="text-sm leading-relaxed text-stone-400">
              We&apos;ll use this to confirm your visit and send updates.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <input
                  className={inputClass}
                  placeholder="First and last name"
                  value={form.fullName}
                  autoComplete="name"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={form.email}
                  autoComplete="email"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </Field>
              <Field
                label="Phone"
                hint="Optional — for day-of texts"
                className="sm:col-span-2"
              >
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  autoComplete="tel"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Field
              label="Booking reference"
              required
              hint="We use this to recognize your request — your real name, a nickname, or even your pet’s name is fine"
            >
              <input
                className={inputClass}
                placeholder="e.g. Your name, a nickname, or your pet’s name"
                maxLength={BOOKING_REFERENCE_MAX_LEN}
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    registrationNumber: e.target.value.slice(
                      0,
                      BOOKING_REFERENCE_MAX_LEN,
                    ),
                  }))
                }
              />
            </Field>
            <div>
              <span className="mb-3 block text-xs font-semibold text-stone-300">
                Service type <span className="text-amber-400/95">*</span>
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                {SERVICE_OPTIONS.map((opt) => {
                  const selected = form.serviceType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, serviceType: opt.value }))
                      }
                      className={[
                        "rounded-xl border px-4 py-3.5 text-left transition-colors",
                        selected
                          ? "border-amber-500/45 bg-amber-500/12 ring-1 ring-amber-400/25"
                          : "border-stone-700/60 bg-stone-950/35 hover:border-stone-600 hover:bg-stone-900/45",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-semibold text-stone-100">
                        {opt.value}
                      </span>
                      <span className="mt-0.5 block text-xs text-stone-500">
                        {opt.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            <p className="text-sm leading-relaxed text-stone-400">
              We&apos;re closed Sundays. Same-day slots must be in the future.
            </p>
            <div className="rounded-2xl border border-stone-800/80 bg-stone-950/35 p-4 sm:p-5">
              <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
                <Field label="Preferred date" required>
                  <DatePicker
                    value={form.preferredDate}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, preferredDate: v }))
                    }
                    placeholder="Select date"
                    label="Preferred date"
                    isDateDisabled={isBookingDayDisabled}
                  />
                </Field>
                <Field label="Time" required>
                  <select
                    value={form.preferredTime}
                    disabled={!timeOptions.length}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        preferredTime: e.target.value,
                      }))
                    }
                    className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-45`}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    {!timeOptions.length ? (
                      <option value="">Choose a date first</option>
                    ) : (
                      timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {formatSlotLabel(t)}
                        </option>
                      ))
                    )}
                  </select>
                </Field>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-stone-800/80 bg-gradient-to-b from-stone-900/50 to-transparent p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                Summary
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-stone-800/70 pb-3">
                  <dt className="text-stone-500">Name</dt>
                  <dd className="text-right font-medium text-stone-100">
                    {form.fullName || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-stone-800/70 pb-3">
                  <dt className="text-stone-500">Email</dt>
                  <dd className="break-all text-right font-medium text-stone-100">
                    {form.email || "—"}
                  </dd>
                </div>
                {form.phone ? (
                  <div className="flex justify-between gap-4 border-b border-stone-800/70 pb-3">
                    <dt className="text-stone-500">Phone</dt>
                    <dd className="text-right font-medium text-stone-100">
                      {form.phone}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 border-b border-stone-800/70 pb-3">
                  <dt className="text-stone-500">Reference</dt>
                  <dd className="text-right font-medium text-stone-100">
                    {form.registrationNumber || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-stone-800/70 pb-3">
                  <dt className="text-stone-500">Service</dt>
                  <dd className="text-right font-medium text-amber-100/95">
                    {form.serviceType}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-stone-800/70 pb-3">
                  <dt className="text-stone-500">Date</dt>
                  <dd className="text-right font-medium text-stone-100">
                    {formatDisplayDate(form.preferredDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Time</dt>
                  <dd className="text-right font-medium text-stone-100">
                    {form.preferredTime
                      ? formatSlotLabel(form.preferredTime)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <Field
              label="Notes for your stylist"
              hint="Optional — allergies, inspiration, preferred stylist…"
              className="block"
            >
              <textarea
                rows={4}
                className="min-h-[6rem] w-full resize-y rounded-xl border border-stone-700/60 bg-stone-950/40 px-3.5 py-3 text-sm leading-relaxed text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
                placeholder="Anything that helps us prepare for your visit."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </Field>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <div className="mt-10 flex flex-col gap-4 border-t border-stone-800/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-600/70 bg-stone-950/40 px-5 py-3 text-sm font-semibold text-stone-200 transition hover:border-stone-500 hover:bg-stone-900/60 disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          ) : (
            <span className="text-xs text-stone-500">
              All steps use the same secure booking request.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-100 px-8 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-stone-950 shadow-[0_12px_40px_-16px_rgba(251,191,36,0.35)] transition hover:bg-amber-50 active:scale-[0.99]"
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submitBooking()}
              disabled={submitting}
              className="inline-flex min-h-12 min-w-[220px] items-center justify-center rounded-full bg-stone-100 px-8 text-sm font-semibold uppercase tracking-[0.12em] text-stone-950 shadow-[0_12px_40px_-16px_rgba(251,191,36,0.35)] transition hover:bg-amber-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? "Sending…" : "Submit booking request"}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-stone-500 sm:text-left">
        By submitting, you agree we may contact you about this appointment.
        Logged-in guests can track requests on the dashboard.
      </p>
    </form>
  );
}

function Field({ label, children, required: isRequired, hint, className = "" }) {
  return (
    <label className={`grid min-w-0 gap-2 ${className}`}>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold text-stone-300">
          {label}
          {isRequired ? (
            <span className="ml-0.5 text-amber-400/95" aria-hidden>
              *
            </span>
          ) : null}
        </span>
        {hint ? (
          <span className="text-[11px] font-normal text-stone-500">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
