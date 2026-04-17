/** Relative time since last login (e.g. "3 minutes ago"). */
export function formatLastLogin(value) {
  if (!value) return "First login";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "First login";

  const diffSeconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

/**
 * Best-effort “last seen” for admin user lists: login time, latest order, profile
 * updates, or any related order activity (covers accounts where `lastLogin` was
 * never backfilled).
 */
export function getLatestActivityDate(user, relatedOrders = []) {
  const times = [];
  const push = (v) => {
    if (v == null || v === "") return;
    const t = new Date(v).getTime();
    if (!Number.isNaN(t) && t > 0) times.push(t);
  };
  push(user?.lastLogin);
  push(user?.latestOrderAt);
  push(user?.updatedAt);
  for (const o of relatedOrders) {
    push(o?.createdAt);
    push(o?.updatedAt);
  }
  if (!times.length) return null;
  return new Date(Math.max(...times));
}

/** Relative “ago” for admin, or em dash when unknown. */
export function formatUserActivityAgo(user, relatedOrders = []) {
  const d = getLatestActivityDate(user, relatedOrders);
  if (!d) return "—";
  const ts = d.getTime();
  if (Number.isNaN(ts)) return "—";
  return formatLastLogin(d);
}
