"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Car } from "lucide-react";
import toast from "react-hot-toast";
import {
  formatSlotLabel,
  isAllowedBookingDate,
  isValidPublicBookingSlot,
  slotsAvailableForPublicBooking,
} from "@/lib/booking-slots";
import { formatVehicleRegistration } from "@/lib/vehicle-registration";
import DatePicker from "@/components/ui/DatePicker";

const chevronSelect =
  "bg-[length:0.875rem] bg-[right_0.65rem_center] bg-no-repeat pr-9";

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export default function BookingFormClient() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    registrationNumber: "",
    serviceType: "Routine Maintenance",
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

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.registrationNumber.trim() ||
      !form.preferredDate.trim() ||
      !form.preferredTime.trim()
    ) {
      toast.error(
        "Please fill in name, email, registration, date, and time.",
      );
      return;
    }

    if (!isAllowedBookingDate(form.preferredDate)) {
      toast.error(
        "Choose a future date when we’re open (not Sunday).",
      );
      return;
    }

    if (!isValidPublicBookingSlot(form.preferredDate, form.preferredTime)) {
      toast.error(
        "Choose a valid time for that day (within opening hours, and not in the past if booking today).",
      );
      return;
    }

    const registrationNumber = formatVehicleRegistration(
      form.registrationNumber,
    ).trim();
    if (!registrationNumber) {
      toast.error("Enter a valid registration or plate.");
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
        serviceType: "Routine Maintenance",
        preferredDate: "",
        preferredTime: "",
        notes: "",
      });
    } catch {
      toast.error("Failed to request booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-sm text-zinc-100 shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-zinc-600 hover:border-white/[0.12] focus:border-orange-500/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-orange-500/20";

  const selectClass = `${inputClass} cursor-pointer appearance-none ${chevronSelect}`;

  const grid3 = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";

  return (
    <form onSubmit={submit} className="mt-6 space-y-8">
      <FormSection title="Your details">
        <div className={grid3}>
          <Field label="Full name" required>
            <input
              className={inputClass}
              placeholder="Your name"
              value={form.fullName}
              autoComplete="name"
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
            />
          </Field>
          <Field label="Phone" hint="Optional">
            <input
              type="tel"
              className={inputClass}
              placeholder="+46 70 000 00 00"
              value={form.phone}
              autoComplete="tel"
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              value={form.email}
              autoComplete="email"
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title={
          <span className="inline-flex items-center gap-2">
            <Car className="size-4 shrink-0 text-orange-500/85" aria-hidden />
            Vehicle & service
          </span>
        }
      >
        <div className={grid3}>
          <Field label="Registration / plate" required>
            <input
              className={inputClass}
              placeholder="e.g. ABC 223"
              value={form.registrationNumber}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  registrationNumber: formatVehicleRegistration(e.target.value),
                }))
              }
            />
          </Field>
          <Field label="Service type" required>
            <select
              value={form.serviceType}
              onChange={(e) =>
                setForm((p) => ({ ...p, serviceType: e.target.value }))
              }
              className={selectClass}
              style={{ backgroundImage: SELECT_ARROW }}
            >
              <option>Routine Maintenance</option>
              <option>Tire Storage</option>
              <option>Spot check</option>
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Preferred slot">
        <p className="-mt-1 mb-4 text-xs text-zinc-500">
          Pick a future day (Mon–Sat). We’re closed Sundays. Then choose a
          time within our hours.
        </p>
        <div className={grid3}>
          <Field label="Date" required>
            <DatePicker
              value={form.preferredDate}
              onChange={(v) => setForm((p) => ({ ...p, preferredDate: v }))}
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
                setForm((p) => ({ ...p, preferredTime: e.target.value }))
              }
              className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-45`}
              style={{ backgroundImage: SELECT_ARROW }}
            >
              {!timeOptions.length ? (
                <option value="">Select a date first</option>
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
      </FormSection>

      <FormSection title="Notes" isLast>
        <div className="lg:grid lg:grid-cols-3">
          <Field
            label="Anything we should know?"
            hint="Optional"
            className="lg:col-span-3"
          >
            <textarea
              rows={3}
              className="min-h-[5.5rem] w-full resize-y rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-sm leading-relaxed text-zinc-100 shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-zinc-600 hover:border-white/[0.12] focus:border-orange-500/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-orange-500/20"
              placeholder="Symptoms, noises, warning lights, or goals…"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="kinetic-gradient inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-8 text-sm font-bold text-zinc-950 shadow-md transition-[filter,transform,box-shadow] duration-200 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100"
        >
          {submitting ? "Sending…" : "Submit request"}
        </button>
        <p className="max-w-xs text-xs leading-relaxed text-zinc-500 sm:text-right">
          By submitting, you agree we may contact you about this appointment.
          Logged-in customers can track requests on the dashboard.
        </p>
      </div>
    </form>
  );
}

function FormSection({ title, children, isLast }) {
  return (
    <div className={isLast ? "" : "border-b border-white/[0.06] pb-8"}>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children, required: isRequired, hint, className = "" }) {
  return (
    <label className={`grid min-w-0 gap-2 ${className}`}>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold text-zinc-300">
          {label}
          {isRequired ? (
            <span className="ml-0.5 text-orange-400" aria-hidden>
              *
            </span>
          ) : null}
        </span>
        {hint ? (
          <span className="text-[11px] font-normal text-zinc-600">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
