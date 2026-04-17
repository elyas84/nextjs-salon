import { NextResponse } from "next/server";
import { getOptionalUser, requireAdmin } from "@/lib/authMiddleware";
import {
  countBlockingBookingsAtSlot,
  isMongoDuplicateKeyError,
  SLOT_TAKEN_MESSAGE,
} from "@/lib/booking-slot-availability";
import { normalizeBookingReference } from "@/lib/booking-reference";
import {
  isAllowedBookingDate,
  isValidPublicBookingSlot,
} from "@/lib/booking-slots";
import { scheduleBookingConfirmedEmails } from "@/lib/booking-confirmation-email";
import { connectDB } from "@/lib/db";
import Booking from "@/lib/models/Booking";

const normalizeBooking = (booking) => ({
  ...booking,
  _id: String(booking._id),
});

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(
      { bookings: bookings.map(normalizeBooking) },
      { status: 200 },
    );
  } catch (err) {
    console.error("List bookings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  // Public endpoint: booking requests from the site.
  try {
    await connectDB();
    const { user } = await getOptionalUser(req);
    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const registrationNumber = normalizeBookingReference(
      body.registrationNumber,
    );
    const serviceType = String(body.serviceType || "").trim();
    const preferredDate = String(body.preferredDate || "").trim();
    const preferredTime = String(body.preferredTime || "").trim();
    const notes = String(body.notes || "").trim();
    const userId = user?.id ? String(user.id).trim() : "";

    if (
      !fullName ||
      !email ||
      !registrationNumber ||
      !serviceType ||
      !preferredDate ||
      !preferredTime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const isoOk = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate);
    if (!isoOk) {
      return NextResponse.json(
        { error: "preferredDate must be yyyy-mm-dd" },
        { status: 400 },
      );
    }

    if (!isAllowedBookingDate(preferredDate)) {
      return NextResponse.json(
        {
          error:
            "Choose a future date when we’re open (Sundays and past days are not available).",
        },
        { status: 400 },
      );
    }

    if (!isValidPublicBookingSlot(preferredDate, preferredTime)) {
      return NextResponse.json(
        {
          error:
            "Invalid time for the selected day (check opening hours, or pick a later slot if booking today).",
        },
        { status: 400 },
      );
    }

    const taken = await countBlockingBookingsAtSlot(Booking, {
      preferredDate,
      preferredTime,
    });
    if (taken > 0) {
      return NextResponse.json({ error: SLOT_TAKEN_MESSAGE }, { status: 409 });
    }

    let booking;
    try {
      booking = await Booking.create({
        fullName,
        email,
        phone,
        registrationNumber,
        serviceType,
        preferredDate,
        preferredTime,
        userId,
        notes,
        status: "confirmed",
      });
    } catch (err) {
      if (isMongoDuplicateKeyError(err)) {
        return NextResponse.json({ error: SLOT_TAKEN_MESSAGE }, { status: 409 });
      }
      throw err;
    }

    scheduleBookingConfirmedEmails(normalizeBooking(booking.toObject()));

    return NextResponse.json(
      {
        message: "Booking confirmed for this time slot.",
        booking: normalizeBooking(booking.toObject()),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

