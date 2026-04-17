/** Shared between server (PATCH whitelist) and client (save payload). No DB imports. */

export const MAX_URL_LEN = 2048;

const heroLimits = {
  ImageUrl: MAX_URL_LEN,
  ImageAlt: 500,
  BadgeText: 200,
  TitleLine1: 200,
  TitleLine2: 200,
  Description: 3000,
  PrimaryCtaLabel: 120,
  PrimaryCtaHref: MAX_URL_LEN,
  SecondaryCtaLabel: 120,
  SecondaryCtaHref: MAX_URL_LEN,
};

const keyServicesLimits = {
  Eyebrow: 120,
  Headline: 200,
  Intro: 800,
  C1Title: 200,
  C1Body: 600,
  C1CtaLabel: 120,
  C1CtaHref: MAX_URL_LEN,
  C1ImageUrl: MAX_URL_LEN,
  C1ImageAlt: 500,
  C2IconLabel: 40,
  C2Title: 200,
  C2Body: 600,
  C2PriceLabel: 120,
  C2Price: 60,
  C2ImageUrl: MAX_URL_LEN,
  C2ImageAlt: 500,
  C3Title: 200,
  C3Body: 600,
  C3CtaLabel: 120,
  C3CtaHref: MAX_URL_LEN,
  C3ImageUrl: MAX_URL_LEN,
  C3ImageAlt: 500,
  C4Title: 200,
  C4Body: 600,
  C4CtaLabel: 120,
  C4CtaHref: MAX_URL_LEN,
  C4ImageUrl: MAX_URL_LEN,
  C4ImageAlt: 500,
};

function prefixedLimits(prefix, limitsObj) {
  /** @type {Record<string, number>} */
  const o = {};
  for (const [suffix, max] of Object.entries(limitsObj)) {
    o[`${prefix}${suffix}`] = max;
  }
  return o;
}

/** Whitelist + max length for every string field (PATCH + API output). */
export const SITE_SETTINGS_STRING_LIMITS = {
  ...prefixedLimits("homeHero", heroLimits),
  ...prefixedLimits("homeKeyServices", keyServicesLimits),
  ...prefixedLimits("servicesHero", heroLimits),
  ...prefixedLimits("servicesKeyServices", keyServicesLimits),
  ...prefixedLimits("aboutHero", heroLimits),
  /** Services page — bottom standard banner only */
  servicesStandardHeadline: 200,
  servicesStandardBullet1: 200,
  servicesStandardBullet2: 200,
  servicesStandardBullet3: 200,
  servicesStandardPrimaryCtaLabel: 120,
  servicesStandardPrimaryCtaHref: MAX_URL_LEN,
  servicesStandardSecondaryCtaLabel: 120,
  servicesStandardSecondaryCtaHref: MAX_URL_LEN,
  servicesStandardWatermark: 80,
  servicesStandardBannerImageUrl: MAX_URL_LEN,
  servicesStandardBannerImageAlt: 500,
  /** About — heritage (copy + stats + side image are separate from hero) */
  aboutHeritageHeadline: 200,
  aboutHeritageBody: 3000,
  aboutHeritageStat1Value: 40,
  aboutHeritageStat1Label: 120,
  aboutHeritageStat2Value: 40,
  aboutHeritageStat2Label: 120,
  aboutHeritageImageCaption: 200,
  aboutHeritageImageUrl: MAX_URL_LEN,
  aboutHeritageImageAlt: 500,
  /** About — engineers strip */
  aboutEngineersHeadline: 200,
  aboutEngineersIntro: 800,
  aboutEngineersCtaLabel: 120,
  aboutEngineersCtaHref: MAX_URL_LEN,
  /** About — bottom CTA strip */
  aboutCtaHeadline: 200,
  aboutCtaBody: 800,
  aboutCtaButtonLabel: 120,
  aboutCtaButtonHref: MAX_URL_LEN,
  aboutCtaBackgroundImageUrl: MAX_URL_LEN,
  aboutCtaBackgroundImageAlt: 500,
  /** About — testimonials block headline (above quotes grid) */
  aboutTestimonialsHeadline: 200,
};
