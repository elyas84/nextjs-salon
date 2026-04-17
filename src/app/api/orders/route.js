import { NextResponse } from "next/server";
import { getOptionalUser, requireAdmin } from "@/lib/authMiddleware";
import { createOrder, listOrdersForAdmin } from "@/lib/store/orders-service";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) {
    return error;
  }

  try {
    const orders = await listOrdersForAdmin();
    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error("List orders error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const { user } = await getOptionalUser(req);
    const body = await req.json();

    const order = await createOrder({ body, user });
    return NextResponse.json(
      { message: "Order created", order },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status =
      message.includes("required") ||
      message.includes("validation failed") ||
      message.includes("enum value")
        ? 400
        : 500;
    console.error("Create order error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
