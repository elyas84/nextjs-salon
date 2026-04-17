/** Shared: testimonial cards show initials derived from the person’s name. */
export function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[parts.length - 1][0] || "";
    return (a + b).toUpperCase().slice(0, 2);
  }
  return s.slice(0, 2).toUpperCase();
}

/** Map stored order to 1–5 for star UI (legacy values are clamped). */
export function orderToStarLevel(order) {
  const n = Number(order);
  if (!Number.isFinite(n) || n <= 0) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}
