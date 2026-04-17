import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { getOrderById } from "@/lib/store/orders-service";
import { renderVatInvoicePdfBuffer } from "@/lib/store/invoice-pdf";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const download =
      searchParams.get("download") === "1" ||
      String(searchParams.get("download") || "").toLowerCase() === "true";

    const { id } = await params;

    if (user?.role !== "superadmin") {
      await connectDB();
      const raw = await Order.findById(id, { user: 1, customerEmail: 1 }).lean();
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
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdf = await renderVatInvoicePdfBuffer(order);
    const orderNumber = String(order.orderNumber || "invoice").trim() || "invoice";

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="invoice-${orderNumber}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Invoice PDF error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

