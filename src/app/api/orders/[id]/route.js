import { NextResponse } from "next/server";
import { authenticate, requireAdmin } from "@/lib/authMiddleware";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { deleteOrderById, getOrderById, updateOrderById } from "@/lib/store/orders-service";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    const { id } = await params;

    if (user?.role === "superadmin") {
      const order = await getOrderById(id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ order }, { status: 200 });
    }

    await connectDB();
    const raw = await Order.findById(id).lean();
    if (!raw) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isOwner =
      (raw.user && String(raw.user) === String(user?.id)) ||
      (raw.customerEmail &&
        String(raw.customerEmail).toLowerCase() ===
          String(user?.email || "").toLowerCase());

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const order = await updateOrderById(id, body);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Order updated", order },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const deleted = await deleteOrderById(id);

    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete order error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
