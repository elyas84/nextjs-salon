import { connectDB } from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/site-settings-service";

const MAX_QUOTE = 1500;
const MAX_NAME = 120;
const MAX_LABEL = 200;
const MAX_HEADLINE = 200;

function trimStr(v, max) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

function mapDoc(t) {
  return {
    id: String(t._id),
    quote: t.quote,
    name: t.name,
    label: t.label || "",
    order: Number.isFinite(Number(t.order)) ? Number(t.order) : 0,
  };
}

/** Public About page + API GET. */
export async function getTestimonialsForAbout() {
  const settings = await getSiteSettings();
  const sectionHeadline =
    trimStr(settings?.aboutTestimonialsHeadline, MAX_HEADLINE) ||
    "CLIENT VOICES";

  await connectDB();
  const rows = await Testimonial.find({})
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return {
    sectionHeadline,
    testimonials: rows.map(mapDoc),
  };
}

export async function createTestimonial(body) {
  const quote = trimStr(body?.quote, MAX_QUOTE);
  const name = trimStr(body?.name, MAX_NAME);
  if (!quote || !name) return null;
  await connectDB();
  const order = Number.isFinite(Number(body?.order))
    ? Number(body.order)
    : (await Testimonial.countDocuments()) + 1;
  const doc = await Testimonial.create({
    quote,
    name,
    label: trimStr(body?.label, MAX_LABEL),
    order,
  });
  return mapDoc(doc.toObject());
}

export async function updateTestimonial(id, body) {
  if (!id) return null;
  await connectDB();
  const patch = {};
  if (body && typeof body === "object") {
    if ("quote" in body) {
      const q = trimStr(body.quote, MAX_QUOTE);
      if (!q) return null;
      patch.quote = q;
    }
    if ("name" in body) {
      const n = trimStr(body.name, MAX_NAME);
      if (!n) return null;
      patch.name = n;
    }
    if ("label" in body) patch.label = trimStr(body.label, MAX_LABEL);
    if ("order" in body && Number.isFinite(Number(body.order))) {
      patch.order = Number(body.order);
    }
  }
  if (Object.keys(patch).length === 0) {
    const doc = await Testimonial.findById(id).lean();
    return doc ? mapDoc(doc) : null;
  }
  const doc = await Testimonial.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true },
  ).lean();
  return doc ? mapDoc(doc) : null;
}

export async function deleteTestimonial(id) {
  if (!id) return false;
  await connectDB();
  const r = await Testimonial.findByIdAndDelete(id);
  return Boolean(r);
}

/** Persists to site settings (`aboutTestimonialsHeadline`). */
export async function updateTestimonialsSectionHeadline(headline) {
  const h = trimStr(headline, MAX_HEADLINE) || "CLIENT VOICES";
  await updateSiteSettings({ aboutTestimonialsHeadline: h });
  return h;
}
