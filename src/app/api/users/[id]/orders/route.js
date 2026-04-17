import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { listOrdersForUser } from "@/lib/store/orders-service";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const orders = await listOrdersForUser({ userId: id });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error("List user orders error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
