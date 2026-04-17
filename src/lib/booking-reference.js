/** Max length for `registrationNumber` stored as booking reference (salon / generic). */
export const BOOKING_REFERENCE_MAX_LEN = 120;

/**
 * Normalize booking reference for storage: trim, collapse whitespace, cap length.
 * Replaces plate-only formatting while keeping the same Mongo field name.
 */
export function normalizeBookingReference(raw) {
  const s = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BOOKING_REFERENCE_MAX_LEN);
  return s;
}
