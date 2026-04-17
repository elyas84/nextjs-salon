import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { listAllReviews, listPendingReviews } from "@/lib/store/reviews-service";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "pending";
    const reviews =
      status === "all" ? await listAllReviews() : await listPendingReviews();
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (err) {
    console.error("List reviews error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
