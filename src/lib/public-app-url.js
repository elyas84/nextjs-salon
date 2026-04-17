/** Origin for links in emails (no trailing slash). */
export function getPublicAppBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_UI?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}
