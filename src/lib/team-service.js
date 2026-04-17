import { connectDB } from "@/lib/db";
import AboutTeamMember from "@/lib/models/AboutTeamMember";
import SiteSettings from "@/lib/models/SiteSettings";

const DEFAULT_KEY = "default";
const MAX_TEAM = 12;

const MAX_NAME = 200;
const MAX_ROLE = 200;
const MAX_ALT = 500;

function trimStr(v, max) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

function mapDoc(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    role: doc.role || "",
    imageUrl: doc.imageUrl || "",
    imageAlt: doc.imageAlt || "",
    order: Number.isFinite(Number(doc.order)) ? Number(doc.order) : 0,
  };
}

let legacyMigrateDone = false;

/**
 * First successful load: if the new collection is empty but legacy embedded
 * `teamMembers` exist on site settings, copy them so the About page keeps working.
 */
async function migrateLegacyTeamIfNeeded() {
  if (legacyMigrateDone) return;
  try {
    const count = await AboutTeamMember.countDocuments();
    if (count > 0) {
      legacyMigrateDone = true;
      return;
    }

    const doc = await SiteSettings.findOne({ key: DEFAULT_KEY }).lean();
    const legacy = Array.isArray(doc?.teamMembers) ? doc.teamMembers : [];
    if (legacy.length === 0) {
      legacyMigrateDone = true;
      return;
    }

    const rows = legacy.slice(0, MAX_TEAM).map((m, i) => ({
      name: trimStr(m?.name, MAX_NAME) || "—",
      role: trimStr(m?.role, MAX_ROLE),
      imageUrl: trimStr(m?.imageUrl),
      imageAlt: trimStr(m?.imageAlt, MAX_ALT),
      order: Number.isFinite(Number(m?.order)) ? Number(m.order) : i,
    }));

    await AboutTeamMember.insertMany(rows);
    legacyMigrateDone = true;
  } catch (err) {
    console.error("migrateLegacyTeamIfNeeded:", err);
  }
}

/** Public About page + GET /api/team */
export async function getTeamForAbout() {
  await connectDB();
  await migrateLegacyTeamIfNeeded();
  const rows = await AboutTeamMember.find({})
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return {
    team: rows.map(mapDoc),
  };
}

export async function createTeamMember(body) {
  const name = trimStr(body?.name, MAX_NAME);
  if (!name) return null;

  await connectDB();
  const n = await AboutTeamMember.countDocuments();
  if (n >= MAX_TEAM) return null;

  const order = Number.isFinite(Number(body?.order))
    ? Number(body.order)
    : n;

  const doc = await AboutTeamMember.create({
    name,
    role: trimStr(body?.role, MAX_ROLE),
    imageUrl: trimStr(body?.imageUrl),
    imageAlt: trimStr(body?.imageAlt, MAX_ALT),
    order,
  });
  return mapDoc(doc.toObject());
}

export async function updateTeamMember(id, body) {
  if (!id) return null;
  await connectDB();

  const patch = {};
  if (body && typeof body === "object") {
    if ("name" in body) {
      const nm = trimStr(body.name, MAX_NAME);
      if (!nm) return null;
      patch.name = nm;
    }
    if ("role" in body) patch.role = trimStr(body.role, MAX_ROLE);
    if ("imageUrl" in body) patch.imageUrl = trimStr(body.imageUrl);
    if ("imageAlt" in body) patch.imageAlt = trimStr(body.imageAlt, MAX_ALT);
    if ("order" in body && Number.isFinite(Number(body.order))) {
      patch.order = Number(body.order);
    }
  }

  if (Object.keys(patch).length === 0) {
    const doc = await AboutTeamMember.findById(id).lean();
    return doc ? mapDoc(doc) : null;
  }

  const doc = await AboutTeamMember.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true },
  ).lean();
  return doc ? mapDoc(doc) : null;
}

export async function deleteTeamMember(id) {
  if (!id) return false;
  await connectDB();
  const r = await AboutTeamMember.findByIdAndDelete(id);
  return Boolean(r);
}
