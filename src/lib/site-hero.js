/**
 * Home (`/`) uses `homeHero*`; Services (`/services`) uses `servicesHero*`.
 * Same layout, independent CMS fields.
 */

export const SITE_HERO_DEFAULTS = {
  badgeText: "Performance Engineered",
  titleLine1: "VELOCITY",
  titleLine2: "DEFINED.",
  description:
    "Beyond standard maintenance. Precision diagnostics, performance-first service, and track-ready upgrades for drivers who won't settle.",
  primaryCtaLabel: "Book a service",
  primaryCtaHref: "/book-a-service",
  secondaryCtaLabel: "Shop parts",
  secondaryCtaHref: "/products",
};

/** Defaults when `aboutHero*` fields are empty (`/about`). */
export const ABOUT_HERO_DEFAULTS = {
  badgeText: "Engineered for Performance",
  titleLine1: "THE PURSUIT OF",
  titleLine2: "PERFECTION",
  description:
    "At Kinetic Precision, we don't just repair vehicles. We restore the soul of high-performance machinery through technical mastery and uncompromising standards.",
  primaryCtaLabel: "Booking",
  primaryCtaHref: "/book-a-service",
  secondaryCtaLabel: "Services",
  secondaryCtaHref: "/services",
};

/**
 * @param {Record<string, string | undefined> | null | undefined} settings
 * @param {string} prefix  `homeHero` | `servicesHero` | `aboutHero`
 * @param {typeof SITE_HERO_DEFAULTS} [defaults]
 */
function resolveHeroWithPrefix(settings, prefix, defaults = SITE_HERO_DEFAULTS) {
  const s = settings || {};
  const d = defaults;
  const pick = (suffix, fallback) => {
    const dbKey = `${prefix}${suffix}`;
    const v = String(s[dbKey] ?? "").trim();
    return v || fallback;
  };
  const imageUrl = String(s[`${prefix}ImageUrl`] || "").trim();
  const imageAlt = String(s[`${prefix}ImageAlt`] || "").trim();
  return {
    badgeText: pick("BadgeText", d.badgeText),
    titleLine1: pick("TitleLine1", d.titleLine1),
    titleLine2: pick("TitleLine2", d.titleLine2),
    description: pick("Description", d.description),
    primaryCtaLabel: pick("PrimaryCtaLabel", d.primaryCtaLabel),
    primaryCtaHref: pick("PrimaryCtaHref", d.primaryCtaHref),
    secondaryCtaLabel: pick("SecondaryCtaLabel", d.secondaryCtaLabel),
    secondaryCtaHref: pick("SecondaryCtaHref", d.secondaryCtaHref),
    imageUrl,
    imageAlt: imageAlt || "Hero",
  };
}

/** @param {Record<string, string | undefined> | null | undefined} settings */
export function resolveHomeHero(settings) {
  return resolveHeroWithPrefix(settings, "homeHero");
}

/** @param {Record<string, string | undefined> | null | undefined} settings */
export function resolveServicesHero(settings) {
  return resolveHeroWithPrefix(settings, "servicesHero");
}

/** Full-bleed hero for `/about` (`aboutHero*`). */
export function resolveAboutHero(settings) {
  return resolveHeroWithPrefix(settings, "aboutHero", ABOUT_HERO_DEFAULTS);
}

/** @deprecated use resolveHomeHero */
export function resolveSiteHero(settings) {
  return resolveHomeHero(settings);
}

/**
 * True when the URL is almost certainly a webpage (HTML), not a direct image file.
 */
export function isLikelyGalleryPageUrl(url) {
  const u = String(url || "").trim();
  if (!u || u.startsWith("/")) return false;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (
      (host === "pexels.com" || host === "www.pexels.com") &&
      path.includes("/photo/")
    ) {
      return true;
    }
    if (host === "unsplash.com" && path.includes("/photos/")) {
      return true;
    }
    if (host.endsWith("instagram.com") || host.endsWith("facebook.com")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function isUsableImageUrl(url) {
  const u = String(url || "").trim();
  if (!u) return false;
  if (isLikelyGalleryPageUrl(u)) return false;
  if (u.startsWith("/")) return true;
  return /^https?:\/\//i.test(u);
}

export const HOME_HERO_DEFAULTS = SITE_HERO_DEFAULTS;
