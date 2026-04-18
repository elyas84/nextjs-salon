import { isUsableImageUrl } from "@/lib/site-hero";

/** Defaults for the Precision Tuning grid (home vs services use different DB prefixes). */
export const SITE_KEY_SERVICES_DEFAULTS = {
  eyebrow: "The menu",
  headline: "Shape, color, and care—on your terms",
  intro:
    "From precision cuts to lived-in color and repair-focused treatments, we map each visit to your hair goals, your budget, and the time you actually have.",
  card1: {
    title: "Cut & finish",
    body: "Precision shaping, texture, and styling that fits your everyday routine.",
    ctaLabel: "See services",
    ctaHref: "/services",
    imageUrl: "",
    imageAlt: "",
  },
  card2: {
    iconLabel: "NEW",
    title: "Color & gloss",
    body: "Balayage, gloss, and corrective color with honest upkeep guidance.",
    priceLabel: "From",
    price: "$95.00",
    imageUrl: "",
    imageAlt: "",
  },
  card3: {
    title: "Treatments",
    body: "Deep conditioning, scalp care, and repair paths for stressed strands.",
    ctaLabel: "",
    ctaHref: "",
    imageUrl: "",
    imageAlt: "",
  },
  card4: {
    title: "Retail & tools",
    body: "Professional-grade care you can take home—shampoo, styling, and more.",
    ctaLabel: "Shop products",
    ctaHref: "/products",
    imageUrl: "",
    imageAlt: "",
  },
};

function pick(s, dbKey, fallback) {
  const v = String(s[dbKey] ?? "").trim();
  return v || fallback;
}

function raw(s, dbKey) {
  return String(s[dbKey] ?? "").trim();
}

function resolveCardBg(s, urlKey, altKey, fallbackAlt) {
  const url = raw(s, urlKey);
  const altText = raw(s, altKey);
  return {
    imageUrl: url,
    imageAlt: altText || fallbackAlt,
    showImage: isUsableImageUrl(url),
  };
}

/**
 * @param {Record<string, string | undefined> | null | undefined} settings
 * @param {string} p  `homeKeyServices` | `servicesKeyServices`
 */
function resolveKeyServicesWithPrefix(settings, p) {
  const s = settings || {};
  const d = SITE_KEY_SERVICES_DEFAULTS;

  const card3Label = raw(s, `${p}C3CtaLabel`);
  const card3Href = raw(s, `${p}C3CtaHref`);
  const card3Cta =
    card3Label && card3Href
      ? { label: card3Label, href: card3Href }
      : { label: d.card3.ctaLabel, href: d.card3.ctaHref };

  const c1bg = resolveCardBg(s, `${p}C1ImageUrl`, `${p}C1ImageAlt`, d.card1.title);
  const c2bg = resolveCardBg(s, `${p}C2ImageUrl`, `${p}C2ImageAlt`, d.card2.title);
  const c3bg = resolveCardBg(s, `${p}C3ImageUrl`, `${p}C3ImageAlt`, d.card3.title);
  const c4bg = resolveCardBg(s, `${p}C4ImageUrl`, `${p}C4ImageAlt`, d.card4.title);

  return {
    eyebrow: pick(s, `${p}Eyebrow`, d.eyebrow),
    headline: pick(s, `${p}Headline`, d.headline),
    intro: pick(s, `${p}Intro`, d.intro),
    card1: {
      title: pick(s, `${p}C1Title`, d.card1.title),
      body: pick(s, `${p}C1Body`, d.card1.body),
      ctaLabel: pick(s, `${p}C1CtaLabel`, d.card1.ctaLabel),
      ctaHref: pick(s, `${p}C1CtaHref`, d.card1.ctaHref),
      ...c1bg,
    },
    card2: {
      iconLabel: pick(s, `${p}C2IconLabel`, d.card2.iconLabel),
      title: pick(s, `${p}C2Title`, d.card2.title),
      body: pick(s, `${p}C2Body`, d.card2.body),
      priceLabel: pick(s, `${p}C2PriceLabel`, d.card2.priceLabel),
      price: pick(s, `${p}C2Price`, d.card2.price),
      ...c2bg,
    },
    card3: {
      title: pick(s, `${p}C3Title`, d.card3.title),
      body: pick(s, `${p}C3Body`, d.card3.body),
      ctaLabel: card3Cta.label,
      ctaHref: card3Cta.href,
      ...c3bg,
    },
    card4: {
      title: pick(s, `${p}C4Title`, d.card4.title),
      body: pick(s, `${p}C4Body`, d.card4.body),
      ctaLabel: pick(s, `${p}C4CtaLabel`, d.card4.ctaLabel),
      ctaHref: pick(s, `${p}C4CtaHref`, d.card4.ctaHref),
      imageUrl: c4bg.imageUrl,
      imageAlt: c4bg.imageAlt,
      showImage: c4bg.showImage,
    },
  };
}

export function resolveHomeKeyServices(settings) {
  return resolveKeyServicesWithPrefix(settings, "homeKeyServices");
}

export function resolveServicesKeyServices(settings) {
  return resolveKeyServicesWithPrefix(settings, "servicesKeyServices");
}

/** @deprecated use resolveHomeKeyServices */
export function resolveSiteKeyServices(settings) {
  return resolveHomeKeyServices(settings);
}
