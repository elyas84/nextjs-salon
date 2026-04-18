"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d) {
  if (!(d instanceof Date)) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromIsoDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  return Number.isNaN(d.getTime()) ? null : d;
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function clampToDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildCalendarDays(monthDate) {
  const first = startOfMonth(monthDate);
  const startWeekday = first.getDay(); // 0 Sun ... 6 Sat
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startWeekday);

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function DatePicker({
  label = "Select date",
  value,
  onChange,
  placeholder = "yyyy-mm-dd",
  defaultValue = "",
  disabled = false,
  /** Return true to block selection (e.g. past dates, Sundays). */
  isDateDisabled,
}) {
  const isControlled = typeof value !== "undefined";
  const [internalValue, setInternalValue] = useState(defaultValue);
  const resolvedValue = isControlled ? value : internalValue;
  const selected = useMemo(() => fromIsoDate(resolvedValue), [resolvedValue]);
  const today = useMemo(() => clampToDay(new Date()), []);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    startOfMonth(selected || today),
  );

  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep calendar month in sync with value
    if (selected) setMonth(startOfMonth(selected));
  }, [selected]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    });
    return fmt.format(month);
  }, [month]);

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const monthIndex = month.getMonth();

  const dayDisabled = (d) =>
    typeof isDateDisabled === "function" ? Boolean(isDateDisabled(d)) : false;
  const todaySelectable = !dayDisabled(today);

  const setValue = (dateOrNull) => {
    const next = dateOrNull ? toIsoDate(dateOrNull) : "";
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-stone-700/60 bg-stone-950/40 px-3.5 text-left text-sm text-stone-100 shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200",
          "hover:border-stone-600/80 focus:border-amber-500/45 focus:bg-stone-900/50 focus:ring-2 focus:ring-amber-500/20",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <span className={selected ? "text-stone-100" : "text-stone-500"}>
          {selected ? toIsoDate(selected) : placeholder}
        </span>
        <CalendarDays className="size-4 text-stone-500" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Date picker"
          className="absolute left-0 top-11 z-50 w-[min(18rem,100%)] overflow-hidden rounded-xl border border-stone-800/80 bg-[#0c0b09] shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone-800/80 px-4 py-3">
            <div className="text-sm font-semibold text-stone-100">{monthLabel}</div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-700/60 bg-stone-950/50 text-stone-200 transition hover:bg-stone-900/80 active:scale-95"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-700/60 bg-stone-950/50 text-stone-200 transition hover:bg-stone-900/80 active:scale-95"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-3 pt-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {days.map((d) => {
                const inMonth = d.getMonth() === monthIndex;
                const isToday = sameDay(d, today);
                const isSelected = selected ? sameDay(d, selected) : false;
                const dis = dayDisabled(d);

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={dis}
                    onClick={() => {
                      if (dis) return;
                      setValue(d);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    className={[
                      "h-9 rounded-md text-sm font-semibold transition active:scale-95",
                      inMonth ? "text-stone-100" : "text-stone-600",
                      isSelected
                        ? "bg-amber-500 text-stone-950"
                        : dis
                          ? "cursor-not-allowed text-stone-600 opacity-35"
                          : "hover:bg-stone-800/80",
                      isToday && !isSelected && !dis
                        ? "ring-1 ring-amber-500/45"
                        : "",
                    ].join(" ")}
                    aria-pressed={isSelected}
                    aria-disabled={dis}
                    aria-label={toIsoDate(d)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-stone-800/80 px-4 py-3">
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-widest text-stone-400 transition hover:text-stone-100"
              onClick={() => setValue(null)}
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!todaySelectable}
              className="text-xs font-semibold uppercase tracking-widest text-amber-300/95 transition hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-amber-300/95"
              onClick={() => {
                if (!todaySelectable) return;
                setValue(today);
                setMonth(startOfMonth(today));
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

