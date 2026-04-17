import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  createTestimonial,
  getTestimonialsForAbout,
} from "@/lib/testimonials-service";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export const dynamic = "force-dynamic";

/** Public: section headline + testimonial cards for /about. */
export async function GET() {
  try {
    const data = await getTestimonialsForAbout();
    return NextResponse.json(data, { status: 200, headers: noStore });
  } catch (err) {
    console.error("GET /api/testimonials:", err);
    return NextResponse.json(
      { error: "Failed to load testimonials" },
      { status: 500, headers: noStore },
    );
  }
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const row = await createTestimonial(body);
    if (!row) {
      return NextResponse.json(
        { error: "Quote and name are required." },
        { status: 400, headers: noStore },
      );
    }
    const data = await getTestimonialsForAbout();
    return NextResponse.json({ testimonial: row, ...data }, { status: 201, headers: noStore });
  } catch (err) {
    console.error("POST /api/testimonials:", err);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500, headers: noStore },
    );
  }
}
