import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  deleteTestimonial,
  getTestimonialsForAbout,
  updateTestimonial,
} from "@/lib/testimonials-service";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const row = await updateTestimonial(id, body);
    if (!row) {
      return NextResponse.json(
        { error: "Not found or invalid fields." },
        { status: 404, headers: noStore },
      );
    }
    const data = await getTestimonialsForAbout();
    return NextResponse.json({ testimonial: row, ...data }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("PATCH /api/testimonials/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500, headers: noStore },
    );
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const ok = await deleteTestimonial(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Not found." },
        { status: 404, headers: noStore },
      );
    }
    const data = await getTestimonialsForAbout();
    return NextResponse.json(data, { status: 200, headers: noStore });
  } catch (err) {
    console.error("DELETE /api/testimonials/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500, headers: noStore },
    );
  }
}
