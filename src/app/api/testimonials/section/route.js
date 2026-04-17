import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  getTestimonialsForAbout,
  updateTestimonialsSectionHeadline,
} from "@/lib/testimonials-service";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const headline = await updateTestimonialsSectionHeadline(body?.headline);
    const data = await getTestimonialsForAbout();
    return NextResponse.json(
      { headline, ...data },
      { status: 200, headers: noStore },
    );
  } catch (err) {
    console.error("PATCH /api/testimonials/section:", err);
    return NextResponse.json(
      { error: "Failed to update section headline" },
      { status: 500, headers: noStore },
    );
  }
}
