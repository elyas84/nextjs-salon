const safe = (value) => String(value || "").replace(/\s+/g, " ").trim();

/** Display / PDF reference e.g. BK-A1B2C3D4 (last 8 hex chars of ObjectId). */
export function bookingRefCode(booking) {
  const id = safe(booking?._id).replace(/[^a-fA-F0-9]/g, "");
  const tail = (id.length >= 8 ? id.slice(-8) : id.padStart(8, "0")).toUpperCase();
  return `BK-${tail}`;
}
