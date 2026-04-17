/** Bottom standards strip on `/services`. */

export const SERVICES_STANDARD_BANNER_DEFAULTS = {
  headline: "The Studio Salon standard.",
  bullet1: "Consultation-first appointments",
  bullet2: "Clean tools & honest timing",
  bullet3: "Care plans you can maintain at home",
  primaryCtaLabel: "Ask a question",
  primaryCtaHref: "/contact",
  secondaryCtaLabel: "Book a visit",
  secondaryCtaHref: "/book-a-service",
  watermark: "STUDIO",
};

/**
 * @param {Record<string, string | undefined> | null | undefined} settings
 */
export function resolveServicesStandardBanner(settings) {
  const s = settings || {};
  const d = SERVICES_STANDARD_BANNER_DEFAULTS;
  const pick = (dbKey, fallback) => {
    const v = String(s[dbKey] ?? "").trim();
    return v || fallback;
  };
  return {
    headline: pick("servicesStandardHeadline", d.headline),
    bullet1: pick("servicesStandardBullet1", d.bullet1),
    bullet2: pick("servicesStandardBullet2", d.bullet2),
    bullet3: pick("servicesStandardBullet3", d.bullet3),
    primaryCtaLabel: pick(
      "servicesStandardPrimaryCtaLabel",
      d.primaryCtaLabel,
    ),
    primaryCtaHref: pick(
      "servicesStandardPrimaryCtaHref",
      d.primaryCtaHref,
    ),
    secondaryCtaLabel: pick(
      "servicesStandardSecondaryCtaLabel",
      d.secondaryCtaLabel,
    ),
    secondaryCtaHref: pick(
      "servicesStandardSecondaryCtaHref",
      d.secondaryCtaHref,
    ),
    watermark: pick("servicesStandardWatermark", d.watermark),
  };
}
