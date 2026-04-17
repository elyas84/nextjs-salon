/**
 * Shared visual + copy tokens for Studio Salon transactional emails
 * (contact form + booking). Keeps HTML emails consistent.
 */
export const SALON = {
  outerBg: "#fdf2f8",
  cardBg: "#ffffff",
  cardBorder: "1px solid #fbcfe8",
  cardShadow: "0 20px 50px rgba(190, 24, 93, 0.08)",
  barGradient:
    "linear-gradient(90deg, #f472b6 0%, #fbcfe8 42%, #fce7f3 100%)",
  headBorderBottom: "1px solid #fce7f3",
  footBorderTop: "1px solid #fce7f3",
  footBg: "#fdf2f8",
  innerPad: "28px 16px",
  radiusLg: "20px",
  radiusMd: "16px",
  radiusSm: "12px",
  text: "#0f172a",
  textMuted: "#64748b",
  textBody: "#475569",
  accent: "#be185d",
  accentBright: "#db2777",
  pillBg: "#fdf2f8",
  pillBorder: "#fbcfe8",
  panelBg: "#fff7fb",
  panelBorder: "1px solid #fce7f3",
  fontStack:
    "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

/** Display name for SMTP From — override with SMTP_FROM_NAME in env */
export function salonEmailFromDisplayName() {
  return (
    process.env.SMTP_FROM_NAME?.trim() ||
    process.env.NEXT_PUBLIC_SITE_NAME?.trim() ||
    "Studio Salon"
  );
}
