/**
 * Normalise plate input to "ABC 223" style: all letters (A–Z), space, all digits.
 * Strips other characters and reorders into letters + digits.
 */
export function formatVehicleRegistration(raw) {
  const upper = String(raw ?? "").toUpperCase();
  const letters = upper.replace(/[^A-Z]/g, "");
  const digits = upper.replace(/\D/g, "");
  if (letters && digits) return `${letters} ${digits}`;
  if (letters) return letters;
  if (digits) return digits;
  return "";
}
