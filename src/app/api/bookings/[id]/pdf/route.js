import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { connectDB } from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { bookingRefCode } from "@/lib/booking-ref";
import { renderBookingConfirmationPdfBuffer } from "@/lib/booking-confirmation-pdf";

export const dynamic = "force-dynamic";

function userOwnsBooking(user, booking) {
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();
  const userId = String(user?.id || "").trim();
  const bEmail = String(booking?.email || "")
    .trim()
    .toLowerCase();
  const bUserId = String(booking?.userId || "").trim();
  if (email && bEmail === email) return true;
  if (userId && bUserId === userId) return true;
  return false;
}

export async function GET(req, { params }) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const download =
      searchParams.get("download") === "1" ||
      String(searchParams.get("download") || "").toLowerCase() === "true";

    await connectDB();
    const { id } = await params;
    const booking = await Booking.findById(id).lean();
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isAdmin = String(user?.role || "") === "superadmin";
    if (!isAdmin && !userOwnsBooking(user, booking)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const normalized = { ...booking, _id: String(booking._id) };
    const pdf = await renderBookingConfirmationPdfBuffer(normalized);
    const ref = bookingRefCode(normalized);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="booking-${ref}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Booking PDF error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
