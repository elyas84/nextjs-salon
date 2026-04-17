import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  countBlockingBookingsAtSlot,
  isMongoDuplicateKeyError,
  SLOT_TAKEN_MESSAGE,
  statusBlocksSlot,
} from "@/lib/booking-slot-availability";
import { isAllowedBookingDate, isValidSlotForDate } from "@/lib/booking-slots";
import {
  scheduleBookingConfirmedEmails,
  sendBookingCancelledEmail,
  sendBookingCompletedEmail,
} from "@/lib/booking-confirmation-email";
import { connectDB } from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { normalizeBookingReference } from "@/lib/booking-reference";

export const dynamic = "force-dynamic";

const normalizeBooking = (booking) => ({
  ...booking,
  _id: String(booking._id),
});

const ALL_STATUSES = [
  "pending",
  "confirmed",
  "waitlisted",
  "completed",
  "cancelled",
];

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
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
    const adminNotes = String(body.adminNotes || "").trim();
    const userId = String(body.userId || "").trim();

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json(
        { error: "preferredDate must be yyyy-mm-dd" },
        { status: 400 },
      );
    }

    if (!isAllowedBookingDate(preferredDate)) {
      return NextResponse.json(
        {
          error:
            "Choose a future open day (Sundays and past dates are not allowed).",
        },
        { status: 400 },
      );
    }

    if (!isValidSlotForDate(preferredDate, preferredTime)) {
      return NextResponse.json(
        { error: "Invalid time for the selected day (check opening hours)." },
        { status: 400 },
      );
    }

    const requested = String(body.status || "").trim().toLowerCase();
    let status;
    if (ALL_STATUSES.includes(requested)) {
      status = requested;
    } else {
      status = "confirmed";
    }

    if (statusBlocksSlot(status)) {
      const taken = await countBlockingBookingsAtSlot(Booking, {
        preferredDate,
        preferredTime,
      });
      if (taken > 0) {
        return NextResponse.json({ error: SLOT_TAKEN_MESSAGE }, { status: 409 });
      }
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
        adminNotes,
        status,
      });
    } catch (err) {
      if (isMongoDuplicateKeyError(err)) {
        return NextResponse.json({ error: SLOT_TAKEN_MESSAGE }, { status: 409 });
      }
      throw err;
    }

    const normalized = normalizeBooking(booking.toObject());
    if (status === "confirmed") {
      scheduleBookingConfirmedEmails(normalized);
    } else if (status === "completed") {
      void sendBookingCompletedEmail(normalized).catch((err) =>
        console.error("Booking completed email failed:", err),
      );
    } else if (status === "cancelled") {
      void sendBookingCancelledEmail(normalized).catch((err) =>
        console.error("Booking cancelled email failed:", err),
      );
    }

    return NextResponse.json(
      { message: "Booking created", booking: normalizeBooking(booking.toObject()) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Admin create booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
