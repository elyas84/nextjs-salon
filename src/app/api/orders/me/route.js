import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { listOrdersForUser } from "@/lib/store/orders-service";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    const orders = await listOrdersForUser({
      userId: authUser.id,
      email: authUser.email,
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error("List my orders error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
