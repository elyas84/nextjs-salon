import { connectDB } from "@/lib/db";
import SiteSettings from "@/lib/models/SiteSettings";
import {
  MAX_URL_LEN,
  SITE_SETTINGS_STRING_LIMITS,
} from "@/lib/site-settings-string-limits";

export { SITE_SETTINGS_STRING_LIMITS } from "@/lib/site-settings-string-limits";

const DEFAULT_KEY = "default";
const MAX_TEAM = 12;

/** e.g. `heroImageUrl` — old shared CMS; not `homeHero*`. */
function isDeprecatedUnifiedHeroKey(k) {
  return /^hero[A-Z]/.test(k);
}

/** e.g. `keyServicesEyebrow` — old shared CMS; not `servicesKeyServices*`. */
function isDeprecatedUnifiedKeyServicesKey(k) {
  return k.startsWith("keyServices");
}

function trimStr(value, max = MAX_URL_LEN) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

/**
 * One-time read compat: old `hero*` / `keyServices*` filled both pages — copy into
 * `home*` / `services*` when those targets are still empty, then DB materialize unsets `hero*` / `keyServices*`.
 */
function mergeDeprecatedUnifiedSiteFields(doc, out) {
  if (!doc) return;
  for (const k of Object.keys(doc)) {
    if (isDeprecatedUnifiedHeroKey(k)) {
      const homeK = k.replace(/^hero/, "homeHero");
      const servicesK = k.replace(/^hero/, "servicesHero");
      const max =
        SITE_SETTINGS_STRING_LIMITS[homeK] ??
        SITE_SETTINGS_STRING_LIMITS[servicesK] ??
        MAX_URL_LEN;
      const v = trimStr(doc[k], max);
      if (!v) continue;
      if (!out[homeK]) out[homeK] = v;
      if (!out[servicesK]) out[servicesK] = v;
      continue;
    }
    if (isDeprecatedUnifiedKeyServicesKey(k)) {
      const homeK = k.replace(/^keyServices/, "homeKeyServices");
      const servicesK = k.replace(/^keyServices/, "servicesKeyServices");
      const max =
        SITE_SETTINGS_STRING_LIMITS[homeK] ??
        SITE_SETTINGS_STRING_LIMITS[servicesK];
      if (max == null) continue;
      const v = trimStr(doc[k], max);
      if (!v) continue;
      if (!out[homeK]) out[homeK] = v;
      if (!out[servicesK]) out[servicesK] = v;
    }
  }
}

function deprecatedUnifiedKeysInDoc(doc) {
  if (!doc || typeof doc !== "object") return [];
  return Object.keys(doc).filter(
    (k) =>
      isDeprecatedUnifiedHeroKey(k) || isDeprecatedUnifiedKeyServicesKey(k),
  );
}

/**
 * Ensure Mongo row has every whitelisted key; drop deprecated `hero*` / `keyServices*`.
 */
async function ensureSiteSettingsRowMaterialized(doc) {
  if (!doc) return doc;
  const unifiedKeys = Object.keys(SITE_SETTINGS_STRING_LIMITS);
  const deprecatedKeys = deprecatedUnifiedKeysInDoc(doc);
  const missingUnified = unifiedKeys.filter(
    (k) => !Object.prototype.hasOwnProperty.call(doc, k),
  );
  if (deprecatedKeys.length === 0 && missingUnified.length === 0) return doc;

  const normalized = normalizeSiteSettings(doc);
  const $set = {};
  for (const k of unifiedKeys) {
    $set[k] = normalized[k];
  }

  const update =
    deprecatedKeys.length > 0
      ? {
          $set,
          $unset: Object.fromEntries(deprecatedKeys.map((k) => [k, ""])),
        }
      : { $set };

  await SiteSettings.collection.updateOne({ key: DEFAULT_KEY }, update);
  return SiteSettings.findOne({ key: DEFAULT_KEY }).lean();
}

function normalizeTeamMember(entry) {
  return {
    name: trimStr(entry?.name, 200),
    role: trimStr(entry?.role, 200),
    imageUrl: trimStr(entry?.imageUrl),
    imageAlt: trimStr(entry?.imageAlt, 500),
    order: Number.isFinite(Number(entry?.order)) ? Number(entry.order) : 0,
  };
}

export function normalizeSiteSettings(doc) {
  if (!doc) return null;
  const team = Array.isArray(doc.teamMembers)
    ? doc.teamMembers.map(normalizeTeamMember)
    : [];
  team.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const out = {
    key: String(doc.key || DEFAULT_KEY),
    teamMembers: team,
    updatedAt: doc.updatedAt || null,
    createdAt: doc.createdAt || null,
  };

  for (const [key, max] of Object.entries(SITE_SETTINGS_STRING_LIMITS)) {
    out[key] = trimStr(doc[key], max);
  }

  mergeDeprecatedUnifiedSiteFields(doc, out);

  return out;
}

/**
 * Public + admin read. Creates the singleton row on first access.
 */
export async function getSiteSettings() {
  await connectDB();
  let doc = await SiteSettings.findOne({ key: DEFAULT_KEY }).lean();
  if (!doc) {
    await SiteSettings.create({ key: DEFAULT_KEY });
    doc = await SiteSettings.findOne({ key: DEFAULT_KEY }).lean();
  }
  doc = await ensureSiteSettingsRowMaterialized(doc);
  return normalizeSiteSettings(doc);
}

/**
 * Partial update (superadmin only — enforce at route). Only whitelisted keys.
 */
export function buildSiteSettingsPatch(body) {
  if (!body || typeof body !== "object") return {};
  const patch = {};

  for (const [key, max] of Object.entries(SITE_SETTINGS_STRING_LIMITS)) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = trimStr(body[key], max);
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "teamMembers")) {
    const list = Array.isArray(body.teamMembers) ? body.teamMembers : [];
    patch.teamMembers = list.slice(0, MAX_TEAM).map(normalizeTeamMember);
  }

  return patch;
}

export async function updateSiteSettings(body) {
  const patch = buildSiteSettingsPatch(body);
  if (Object.keys(patch).length === 0) {
    return getSiteSettings();
  }

  await connectDB();
  await SiteSettings.findOneAndUpdate(
    { key: DEFAULT_KEY },
    { $set: patch },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return getSiteSettings();
}
