/**
 * Workshop slot rules (aligned with book-a-service copy: Mon–Fri 9–18, Sat 10–15).
 * Used by the booking API and the client form.
 */

export const WEEKDAY_SLOT_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const SATURDAY_SLOT_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00"];

/** @param {string} iso yyyy-mm-dd */
export function slotsForIsoDateLocal(iso) {
  const raw = String(iso || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return [];
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  if (Number.isNaN(d.getTime())) return [];
  const day = d.getDay();
  if (day === 0) return [];
  if (day === 6) return [...SATURDAY_SLOT_TIMES];
  return [...WEEKDAY_SLOT_TIMES];
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * yyyy-mm-dd: today or future, not Sunday, within shop opening pattern.
 * Use for API validation and clearing stale client state.
 */
export function isAllowedBookingDate(iso) {
  const raw = String(iso || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  if (Number.isNaN(d.getTime())) return false;
  if (d.getDay() === 0) return false;
  const today = new Date();
  if (startOfLocalDay(d) < startOfLocalDay(today)) return false;
  return slotsForIsoDateLocal(raw).length > 0;
}

/** @param {string} iso @param {string} time HH:mm */
export function isValidSlotForDate(iso, time) {
  const t = String(time || "").trim();
  return slotsForIsoDateLocal(iso).includes(t);
}

function localYmdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotToMinutes(timeStr) {
  const t = String(timeStr || "").trim();
  const [h, min] = t.split(":").map((x) => Number(x));
  if (Number.isNaN(h)) return NaN;
  return h * 60 + (Number.isFinite(min) ? min : 0);
}

/**
 * Public booking: same calendar-day slots that are already in the past are removed
 * so customers cannot confirm e.g. 9:00 AM when it is already afternoon.
 */
export function slotsAvailableForPublicBooking(iso, now = new Date()) {
  const slots = slotsForIsoDateLocal(iso);
  const raw = String(iso || "").trim();
  if (!raw.match(/^\d{4}-\d{2}-\d{2}$/)) return [];
  if (localYmdFromDate(now) !== raw) return slots;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return slots.filter((t) => slotToMinutes(t) > nowMins);
}

/** Public POST: must be a valid shop slot and not a past time on the same day. */
export function isValidPublicBookingSlot(iso, time) {
  const t = String(time || "").trim();
  return slotsAvailableForPublicBooking(iso).includes(t);
}

export function formatSlotLabel(time) {
  const t = String(time || "").trim();
  const [h, min] = t.split(":").map((x) => Number(x));
  if (Number.isNaN(h)) return t;
  const d = new Date();
  d.setHours(h, min || 0, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
