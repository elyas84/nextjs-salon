import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { listReviewsByUser } from "@/lib/store/reviews-service";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    const reviews = await listReviewsByUser(authUser.id);
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (err) {
    console.error("List my reviews error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
