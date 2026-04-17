import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { connectDB } from "@/lib/db";
import Booking from "@/lib/models/Booking";

export const dynamic = "force-dynamic";

const normalizeBooking = (booking) => ({
  ...booking,
  _id: String(booking._id),
});

export async function GET(req) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  const email = String(user?.email || "")
    .trim()
    .toLowerCase();
  const userId = String(user?.id || "").trim();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const or = [{ email }];
    if (userId) or.push({ userId });
    const bookings = await Booking.find({ $or: or })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(
      { bookings: bookings.map(normalizeBooking) },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    console.error("List my bookings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
